export const SCHEMA_SAMPLE = JSON.stringify({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    order_id: { type: 'string', pattern: '^[0-9]+$' },
    paid: { type: 'boolean' },
  },
  required: ['order_id', 'paid'],
  additionalProperties: false,
}, null, 2);
export const INSTANCE_SAMPLE = '{"order_id":42,"paid":true}';
