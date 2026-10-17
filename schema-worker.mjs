import { validateInstance } from './schema-core.mjs';

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ result: validateInstance(data.schema, data.instance) });
  } catch (error) {
    self.postMessage({ error: error.message || '验证失败' });
  }
};
