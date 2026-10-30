import Papa from 'papaparse';

export const SAMPLE_CSV = 'order_id,customer,amount,order_date,note\r\n00127,  Ada  ,89.50,2026-10-01,"first, paid"\r\n00128,Ben,120,10/02/2026,ready\r\n00127, Ada ,89.50,2026-10-01,"first, paid"\r\n00127,Ada,99.00,2026-10-01,amount changed\r\n,  , , , \r\n00129,Chen,45,2026-10-03,"line one\nline two"\r\n';

const isBlank = (row) => row.every((cell) => String(cell).trim() === '');
const isFormula = (value) => /^[\s]*[=+\-@]/.test(value) && !/^\s*-\d+(?:\.\d+)?\s*$/.test(value);

export function parseCsv(text, delimiter = '') {
  if (typeof text !== 'string' || !text.trim()) throw new Error('请先选择 CSV 文件或载入示例。');
  if (text.length > 2_000_000) throw new Error('文件文本超过 2 MB，请先拆分文件。');
  const parsed = Papa.parse(text.replace(/^\uFEFF/, ''), {
    delimiter: delimiter || '',
    skipEmptyLines: false,
    dynamicTyping: false,
    quoteChar: '"',
    escapeChar: '"',
  });
  const rows = parsed.data;
  if (!rows.length || isBlank(rows[0])) throw new Error('首行没有表头，请检查分隔符或文件内容。');
  const headers = rows[0];
  const data = rows.slice(1);
  if (/\r?\n$/.test(text) && data.length && data[data.length - 1].length === 1 && data[data.length - 1][0] === '') data.pop();
  if (data.length > 20000) throw new Error('超过 20,000 行，请先拆分文件。');
  return {
    headers, rows: data, delimiter: parsed.meta.delimiter || ',',
    parseErrors: parsed.errors.filter((error) => error.code !== 'UndetectableDelimiter'),
    delimiterUncertain: parsed.errors.some((error) => error.code === 'UndetectableDelimiter'),
  };
}

export function auditCsv(parsed) {
  const issues = [];
  const counts = { malformed: parsed.parseErrors.length, width: 0, blank: 0, leadingZero: 0, longNumber: 0, dateLike: 0, formula: 0, duplicateHeader: 0 };
  let totalIssues = parsed.parseErrors.length;
  const add = (type, row, column, detail) => {
    counts[type] += 1;
    totalIssues += 1;
    if (issues.length < 150) issues.push({ type, row, column, detail });
  };
  parsed.parseErrors.forEach((error) => {
    if (issues.length < 150) issues.push({ type: 'malformed', row: error.row + 2, column: null, detail: error.message });
  });
  const seenHeaders = new Set();
  parsed.headers.forEach((header, column) => {
    const normalized = String(header).trim().toLowerCase();
    if (!normalized || seenHeaders.has(normalized)) add('duplicateHeader', 1, column + 1, !normalized ? '空表头' : '重复表头');
    seenHeaders.add(normalized);
  });
  parsed.rows.forEach((row, index) => {
    const line = index + 2;
    if (isBlank(row)) { add('blank', line, null, '整行为空'); return; }
    if (row.length !== parsed.headers.length) add('width', line, null, `应有 ${parsed.headers.length} 列，实际 ${row.length} 列`);
    row.forEach((raw, column) => {
      const value = String(raw).trim();
      if (/^0\d+$/.test(value)) add('leadingZero', line, column + 1, '前导零可能被表格软件去掉');
      if (/^\d{16,}$/.test(value)) add('longNumber', line, column + 1, '长数字可能失去精度');
      if (/^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(value)) add('dateLike', line, column + 1, '日期格式可能被误判');
      if (isFormula(raw)) add('formula', line, column + 1, '以公式字符开头，导出前需处理');
    });
  });
  return { counts, issues, truncated: totalIssues > issues.length };
}

export function cleanCsv(parsed, { trim = true, removeBlank = true, dedupeColumn = -1 } = {}) {
  if (parsed.parseErrors.length) throw new Error('CSV 有解析错误，先修复引号或分隔符后再导出。');
  if (parsed.rows.some((row) => !isBlank(row) && row.length !== parsed.headers.length)) throw new Error('有行的列数与表头不一致，先检查文件后再导出。');
  if (!Number.isInteger(dedupeColumn) || dedupeColumn < -1 || dedupeColumn >= parsed.headers.length) throw new Error('去重列无效。');
  const seen = new Map();
  const rows = [];
  const changes = { trimmedCells: 0, removedBlankRows: 0, removedDuplicates: 0, conflictingKeys: 0, guardedFormulas: 0 };
  const conflicts = [];
  parsed.rows.forEach((sourceRow, index) => {
    if (removeBlank && isBlank(sourceRow)) { changes.removedBlankRows += 1; return; }
    const row = sourceRow.map((raw) => {
      const value = String(raw);
      const cleaned = trim ? value.trim() : value;
      if (cleaned !== value) changes.trimmedCells += 1;
      return cleaned;
    });
    if (dedupeColumn >= 0 && row[dedupeColumn] !== '') {
      const signature = JSON.stringify(row);
      const prior = seen.get(row[dedupeColumn]);
      if (prior?.has(signature)) { changes.removedDuplicates += 1; return; }
      if (prior) { changes.conflictingKeys += 1; conflicts.push({ row: index + 2, key: row[dedupeColumn] }); prior.add(signature); }
      else seen.set(row[dedupeColumn], new Set([signature]));
    }
    for (let column = 0; column < row.length; column += 1) {
      if (isFormula(row[column])) { row[column] = `'${row[column]}`; changes.guardedFormulas += 1; }
    }
    rows.push(row);
  });
  const csv = Papa.unparse([parsed.headers, ...rows], { delimiter: parsed.delimiter, newline: '\r\n' });
  return { csv, rows, changes, conflicts };
}
