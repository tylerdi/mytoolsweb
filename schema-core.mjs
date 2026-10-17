import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
export { SCHEMA_SAMPLE, INSTANCE_SAMPLE } from './schema-samples.mjs';

function parseJson(text, label) {
  try { return JSON.parse(text); }
  catch (error) { throw new Error(`${label} 不是合法 JSON：${error.message}`); }
}

function describeError(error) {
  let path = error.instancePath || '/';
  if (error.keyword === 'required') path += `${path === '/' ? '' : '/'}${error.params.missingProperty}`;
  if (error.keyword === 'additionalProperties') path += `${path === '/' ? '' : '/'}${error.params.additionalProperty}`;
  return `${path} · ${error.message || error.keyword}`;
}

export function validateInstance(schemaText, instanceText) {
  const schema = parseJson(schemaText, 'Schema');
  const instance = parseJson(instanceText, '数据');
  if (typeof schema !== 'boolean' && (schema === null || typeof schema !== 'object' || Array.isArray(schema))) {
    throw new Error('Schema 顶层应为对象或布尔值；本站只支持 JSON Schema 2020-12');
  }
  const ajv = new Ajv2020({ allErrors: true, strictSchema: true, strictTypes: false, strictTuples: false });
  addFormats(ajv);
  if (!ajv.validateSchema(schema)) {
    return { schemaValid: false, valid: false, errors: (ajv.errors || []).map(describeError) };
  }
  let validate;
  try { validate = ajv.compile(schema); }
  catch (error) { throw new Error(`Schema 无法编译：${error.message}`); }
  const valid = validate(instance);
  return {
    schemaValid: true,
    valid,
    errors: valid ? [] : (validate.errors || []).map(describeError),
  };
}
