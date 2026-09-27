import { App, Stack } from 'aws-cdk-lib/core';
import { loadConfig } from '../lib/config';

describe('loadConfig', () => {
  test('throws a clear error when opensearchRoleArn context is missing', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    expect(() => loadConfig(stack)).toThrow(/opensearchRoleArn/);
  });

  test('returns the ARN when context is present', () => {
    const app = new App({
      context: { opensearchRoleArn: 'arn:aws:iam::123456789012:role/opensearch-access' },
    });
    const stack = new Stack(app, 'TestStack');
    expect(loadConfig(stack)).toEqual({
      opensearchRoleArn: 'arn:aws:iam::123456789012:role/opensearch-access',
    });
  });
});
