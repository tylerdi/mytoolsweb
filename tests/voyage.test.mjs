import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanVoyageProgress, migrateVoyageProgress, nextVoyageLevel, saveVoyageResult } from '../assets/voyage.mjs';

test('new signal campaign preserves unchanged early levels without awarding the redesigned ones',()=>{
  const old={1:{steps:6,hints:0},8:{steps:20,hints:1},9:{steps:22,hints:0},12:{steps:28,hints:0}};
  assert.deepEqual(migrateVoyageProgress(null,old,12,8),{1:old[1],8:old[8]});
  assert.deepEqual(migrateVoyageProgress({},old,12,8),{});
  const current={9:{steps:22,hints:0}};
  assert.deepEqual(migrateVoyageProgress(current,old,12,8),current);
});

test('local voyage progress rejects corrupt scores and levels outside this game', () => {
  assert.deepEqual(cleanVoyageProgress(null, 12), {});
  assert.deepEqual(cleanVoyageProgress([], 12), {});
  assert.deepEqual(cleanVoyageProgress({ 1: { steps: 8, hints: 0 }, 2: { steps: -1, hints: 0 }, 3: { steps: 8, hints: 4 }, 4: { steps: '8', hints: 0 }, 13: { steps: 8, hints: 0 } }, 12), { 1: { steps: 8, hints: 0 } });
});

test('continue targets the earliest unfinished map, with a safe replay after all maps', () => {
  const progress = {};
  assert.equal(nextVoyageLevel(progress, 3), 1);
  saveVoyageResult(progress, 3, { steps: 9, hints: 0 });
  saveVoyageResult(progress, 1, { steps: 8, hints: 1 });
  assert.equal(nextVoyageLevel(progress, 3), 2);
  saveVoyageResult(progress, 2, { steps: 8, hints: 0 });
  assert.equal(nextVoyageLevel(progress, 3), 1);
});

test('replaying a map retains fewer steps then fewer hints, independent of daily scores', () => {
  const progress = {};
  saveVoyageResult(progress, 1, { steps: 9, hints: 1 });
  saveVoyageResult(progress, 1, { steps: 10, hints: 0 });
  assert.deepEqual(progress[1], { steps: 9, hints: 1 });
  saveVoyageResult(progress, 1, { steps: 9, hints: 0 });
  saveVoyageResult(progress, 1, { steps: 8, hints: 2 });
  assert.deepEqual(cleanVoyageProgress(JSON.parse(JSON.stringify(progress)), 12), { 1: { steps: 8, hints: 2 } });
});
