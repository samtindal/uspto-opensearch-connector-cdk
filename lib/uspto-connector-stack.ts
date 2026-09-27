import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

export class UsptoConnectorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }
}
