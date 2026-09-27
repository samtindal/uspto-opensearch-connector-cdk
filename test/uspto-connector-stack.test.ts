import { App } from 'aws-cdk-lib/core';
import { UsptoConnectorStack } from '../lib/uspto-connector-stack';

describe('UsptoConnectorStack', () => {
  test('synthesizes without error', () => {
    const app = new App();
    expect(() => new UsptoConnectorStack(app, 'TestStack')).not.toThrow();
  });
});
