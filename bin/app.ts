#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { UsptoConnectorStack } from '../lib/uspto-connector-stack';

const app = new cdk.App();

new UsptoConnectorStack(app, 'UsptoConnectorStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
