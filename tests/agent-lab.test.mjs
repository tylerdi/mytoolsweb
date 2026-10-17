import test from 'node:test';
import assert from 'node:assert/strict';
import { getScenario, SCENARIOS } from '../agent-lab.mjs';

test('each scenario has a complete, ordered trace', () => {
  for (const scenario of Object.values(SCENARIOS)) {
    assert.ok(scenario.steps.length >= 4);
    assert.ok(scenario.steps.every((step) => step.stage && step.detail && step.trace));
  }
});

test('invalid arguments never claim the tool executed', () => {
  const steps = getScenario('invalid').steps;
  assert.match(steps[2].trace, /rejected/);
  assert.match(steps[2].detail, /不会执行/);
});
