import { SAMPLE_CSV, auditCsv, cleanCsv, parseCsv } from './csv-core.mjs';

const LABELS = {
  malformed: '解析错误', width: '列数不齐', blank: '空行', leadingZero: '前导零', conflict: '重复键冲突',
  longNumber: '长数字', dateLike: '日期疑义', formula: '公式风险', duplicateHeader: '表头问题',
};

function download(name, contents, type) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderTable(table, headers, rows) {
  table.replaceChildren();
  const head = table.createTHead().insertRow();
  for (const title of headers) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = title || '未命名列';
    head.append(cell);
  }
  const body = table.createTBody();
  for (const row of rows.slice(0, 12)) {
    const tr = body.insertRow();
    for (let index = 0; index < headers.length; index += 1) {
      const cell = tr.insertCell();
      cell.textContent = row[index] ?? '';
      if (row[index] === undefined) cell.className = 'missing-cell';
    }
  }
}

function reportText(parsed, audit, cleaned) {
  const lines = [
    '# CSV 体检与修复记录', '',
    `- 原始数据行：${parsed.rows.length}`,
    `- 输出数据行：${cleaned.rows.length}`,
    `- 检测到的问题：${Object.values(audit.counts).reduce((sum, value) => sum + value, 0)}`,
    `- 去掉空行：${cleaned.changes.removedBlankRows}`,
    `- 按键去重：${cleaned.changes.removedDuplicates}`,
    `- 同键但内容不同、已保留待复核：${cleaned.changes.conflictingKeys}`,
    `- 去掉首尾空格的单元格：${cleaned.changes.trimmedCells}`,
    `- 前缀保护的公式样式值：${cleaned.changes.guardedFormulas}`,
    '', '## 原始文件风险', '',
    ...Object.entries(audit.counts).map(([key, value]) => `- ${LABELS[key]}：${value}`),
    ...cleaned.conflicts.map((item) => `- 第 ${item.row} 条 CSV 记录（含表头）的去重键与前面记录冲突，已保留。`),
    '', '## 人工复核', '',
    '- 前导零和长数字在导出的 CSV 中保留原始文本，但 Excel 直接打开时仍可能转换。请用“数据 → 从文本/CSV”导入，并把标识列设为文本。',
    '- 日期样式只提示，不自动改写。不同地区的月/日顺序不能靠猜测确定。',
    '- 公式样式值已加单引号前缀以降低打开时执行的风险；不同表格软件行为不同，仍需检查。',
    '- 同键且整行完全一致才自动删除；同键但其他列不同会保留并列为冲突。空键不去重。',
  ];
  return lines.join('\n');
}

function mount(root) {
  const file = root.querySelector('[data-csv-file]');
  const encoding = root.querySelector('[data-encoding]');
  const delimiter = root.querySelector('[data-delimiter]');
  const key = root.querySelector('[data-key]');
  const trim = root.querySelector('[data-trim]');
  const removeBlank = root.querySelector('[data-remove-blank]');
  const status = root.querySelector('[data-status]');
  const summary = root.querySelector('[data-summary]');
  const issues = root.querySelector('[data-issues]');
  const issueFilter = root.querySelector('[data-issue-filter]');
  const table = root.querySelector('[data-table]');
  const viewButtons = [...root.querySelectorAll('[data-view]')];
  const cleanButton = root.querySelector('[data-clean]');
  const csvButton = root.querySelector('[data-download-csv]');
  const reportButton = root.querySelector('[data-download-report]');
  let source = '';
  let sourceName = 'sample.csv';
  let parsed = null;
  let audit = null;
  let cleaned = null;
  let view = 'original';
  let loadVersion = 0;
  let decodeNote = '';

  function setStatus(message, state = 'idle') {
    status.textContent = message;
    status.dataset.state = state;
  }

  function draw() {
    if (!parsed) return;
    const counts = audit.counts;
    summary.replaceChildren();
    const stats = [
      ['数据行', parsed.rows.length], ['问题提示', Object.values(counts).reduce((sum, n) => sum + n, 0) + (cleaned?.conflicts.length || 0)],
      ['列数错误', counts.width], ['前导零', counts.leadingZero], ['长数字', counts.longNumber],
    ];
    for (const [label, value] of stats) {
      const item = document.createElement('div');
      const number = document.createElement('strong');
      number.textContent = String(value);
      const name = document.createElement('span');
      name.textContent = label;
      item.append(number, name);
      summary.append(item);
    }
    const allIssues = [...audit.issues, ...(cleaned?.conflicts || []).map((item) => ({ type: 'conflict', row: item.row, column: null, detail: '同键对应不同内容，已保留' }))];
    const filtered = issueFilter.value === 'all' ? allIssues : allIssues.filter((issue) => issue.type === issueFilter.value);
    issues.replaceChildren();
    if (!filtered.length) issues.textContent = '当前筛选下没有提示。';
    for (const issue of filtered.slice(0, 20)) {
      const row = document.createElement('li');
      const position = issue.type === 'duplicateHeader' ? `表头 · 第 ${issue.column} 列` : issue.column ? `第 ${issue.row} 条记录 · 第 ${issue.column} 列` : `第 ${issue.row} 条记录`;
      row.textContent = `${LABELS[issue.type]} · ${position} · ${issue.detail}`;
      issues.append(row);
    }
    if (filtered.length > 20 || audit.truncated) {
      const more = document.createElement('li');
      more.textContent = '问题较多，仅展示前 20 条；统计数字覆盖整个文件。';
      issues.append(more);
    }
    renderTable(table, parsed.headers, view === 'cleaned' && cleaned ? cleaned.rows : parsed.rows);
    viewButtons.forEach((button) => {
      button.disabled = button.dataset.view === 'cleaned' && !cleaned;
      button.setAttribute('aria-pressed', String(button.dataset.view === view));
    });
    cleanButton.disabled = false;
    csvButton.disabled = !cleaned;
    reportButton.disabled = !cleaned;
  }

  function analyze() {
    cleaned = null;
    view = 'original';
    try {
      parsed = parseCsv(source, delimiter.value);
      audit = auditCsv(parsed);
      key.replaceChildren(new Option('不去重', '-1'));
      parsed.headers.forEach((header, index) => key.add(new Option(header || `第 ${index + 1} 列`, String(index))));
      setStatus(`${sourceName} · ${parsed.rows.length} 行 · ${parsed.headers.length} 列 · 分隔符 ${parsed.delimiter === '\t' ? 'Tab' : parsed.delimiter}${parsed.delimiterUncertain ? '（自动检测不确定，请核对）' : ''}${decodeNote}`, audit.counts.malformed || audit.counts.width ? 'error' : parsed.delimiterUncertain || decodeNote ? 'warning' : 'success');
      draw();
    } catch (error) {
      parsed = null;
      audit = null;
      table.replaceChildren();
      summary.replaceChildren();
      issues.replaceChildren();
      cleanButton.disabled = true;
      csvButton.disabled = true;
      reportButton.disabled = true;
      setStatus(error.message, 'error');
    }
  }

  async function readFile() {
    const version = ++loadVersion;
    const selected = file.files?.[0];
    source = '';
    parsed = null;
    audit = null;
    cleaned = null;
    decodeNote = '';
    table.replaceChildren();
    summary.replaceChildren();
    issues.replaceChildren();
    key.replaceChildren(new Option('不去重', '-1'));
    cleanButton.disabled = true;
    csvButton.disabled = true;
    reportButton.disabled = true;
    if (!selected) return;
    if (selected.size > 2_000_000) { setStatus('文件超过 2 MB，请先拆分。', 'error'); return; }
    sourceName = selected.name;
    try {
      const bytes = await selected.arrayBuffer();
      if (version !== loadVersion) return;
      const selectedEncoding = encoding.value;
      if (selectedEncoding === 'auto') {
        try { source = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
        catch { source = new TextDecoder('gb18030', { fatal: true }).decode(bytes); decodeNote = ' · UTF-8 失败，已尝试 GB18030，请核对'; }
      } else source = new TextDecoder(selectedEncoding, { fatal: true }).decode(bytes);
      analyze();
    } catch {
      source = '';
      setStatus('解码失败。请选择正确编码，或检查文件是否真的是 CSV。', 'error');
    }
  }

  root.querySelector('[data-sample]').addEventListener('click', () => {
    loadVersion += 1;
    file.value = '';
    sourceName = 'orders-messy.csv';
    source = SAMPLE_CSV;
    decodeNote = '';
    encoding.value = 'auto';
    delimiter.value = '';
    analyze();
  });
  file.addEventListener('change', readFile);
  encoding.addEventListener('change', () => { if (file.files?.length) readFile(); });
  delimiter.addEventListener('change', () => { if (source) analyze(); });
  issueFilter.addEventListener('change', draw);
  for (const control of [key, trim, removeBlank]) control.addEventListener('change', () => {
    if (!cleaned) return;
    cleaned = null;
    view = 'original';
    setStatus('处理选项已变化，请重新生成结果。', 'warning');
    draw();
  });
  cleanButton.addEventListener('click', () => {
    if (!parsed) return;
    try {
      cleaned = cleanCsv(parsed, { trim: trim.checked, removeBlank: removeBlank.checked, dedupeColumn: Number(key.value) });
      view = 'cleaned';
      setStatus(`已生成 ${cleaned.rows.length} 行 · 删除 ${cleaned.changes.removedDuplicates} 行完全重复记录 · 保留 ${cleaned.changes.conflictingKeys} 行冲突待复核`, cleaned.changes.conflictingKeys ? 'warning' : 'success');
      draw();
    } catch (error) { cleaned = null; setStatus(error.message, 'error'); draw(); }
  });
  viewButtons.forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.view === 'cleaned' && !cleaned) return;
    view = button.dataset.view;
    draw();
  }));
  csvButton.addEventListener('click', () => {
    if (!cleaned) return;
    download(sourceName.replace(/\.csv$/i, '') + '-cleaned.csv', '\uFEFF' + cleaned.csv, 'text/csv;charset=utf-8');
  });
  reportButton.addEventListener('click', () => {
    if (!cleaned) return;
    download(sourceName.replace(/\.csv$/i, '') + '-report.md', reportText(parsed, audit, cleaned), 'text/markdown;charset=utf-8');
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('[data-csv-workbench]').forEach(mount));
}
