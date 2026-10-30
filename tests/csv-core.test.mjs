import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SAMPLE_CSV, auditCsv, cleanCsv, parseCsv } from '../csv-core.mjs';

test('sample keeps quoted comma and newline, reports risky values, and cleans by order ID', () => {
  const parsed = parseCsv(SAMPLE_CSV);
  assert.equal(parsed.headers.length, 5);
  assert.equal(parsed.rows[0][4], 'first, paid');
  assert.equal(parsed.rows[5][4], 'line one\nline two');
  const audit = auditCsv(parsed);
  assert.equal(audit.counts.leadingZero, 5);
  assert.equal(audit.counts.dateLike, 1);
  assert.equal(audit.counts.blank, 1);
  const cleaned = cleanCsv(parsed, { dedupeColumn: 0 });
  assert.equal(cleaned.changes.removedDuplicates, 1);
  assert.equal(cleaned.changes.conflictingKeys, 1);
  assert.equal(cleaned.changes.removedBlankRows, 1);
  assert.equal(cleaned.changes.trimmedCells, 2);
  assert.deepEqual(cleaned.rows.map((row) => row[0]), ['00127', '00128', '00127', '00129']);
  assert.equal(parseCsv(cleaned.csv).rows[3][4], 'line one\nline two');
});

test('does not coerce long IDs or leading zeros, and guards formula-like output', () => {
  const parsed = parseCsv('id,note\n00123,"=HYPERLINK(\"\"bad\"\")"\n12345678901234567890,ok');
  const audit = auditCsv(parsed);
  assert.equal(audit.counts.leadingZero, 1);
  assert.equal(audit.counts.longNumber, 1);
  assert.equal(audit.counts.formula, 1);
  const result = cleanCsv(parsed);
  assert.equal(result.rows[0][1][0], "'");
  assert.equal(result.rows[1][0], '12345678901234567890');
});

test('blocks export for malformed quotes or irregular column counts', () => {
  const irregular = parseCsv('a,b\n1,2\n3');
  assert.equal(auditCsv(irregular).counts.width, 1);
  assert.throws(() => cleanCsv(irregular), /列数/);
  const malformed = parseCsv('a,b\n"unfinished,2');
  assert.ok(malformed.parseErrors.length);
  assert.throws(() => cleanCsv(malformed), /解析错误/);
});

test('deduplication uses selected column and leaves empty keys alone', () => {
  const parsed = parseCsv('id,value\na,first\na,second\n,unknown\n,other');
  const cleaned = cleanCsv(parsed, { dedupeColumn: 0 });
  assert.deepEqual(cleaned.rows.map((row) => row[1]), ['first', 'second', 'unknown', 'other']);
  assert.equal(cleaned.changes.conflictingKeys, 1);
});

test('downloadable order fixture matches the documented six-row scenario', () => {
  const fixture = readFileSync(new URL('../samples/orders-messy.csv', import.meta.url), 'utf8');
  const parsed = parseCsv(fixture);
  const cleaned = cleanCsv(parsed, { dedupeColumn: 0 });
  assert.equal(parsed.rows.length, 6);
  assert.equal(cleaned.rows.length, 4);
  assert.equal(cleaned.changes.conflictingKeys, 1);
});

test('preserves ordinary negative amounts while guarding formula-like strings', () => {
  const parsed = parseCsv('amount,note\n-12.50,refund\n=1+1,untrusted', ',');
  const cleaned = cleanCsv(parsed);
  assert.equal(cleaned.rows[0][0], '-12.50');
  assert.equal(cleaned.rows[1][0], "'=1+1");
  assert.equal(cleaned.changes.guardedFormulas, 1);
});
