import { Construct } from 'constructs';

export interface StackConfig {
  readonly opensearchRoleArn: string;
}

export function loadConfig(scope: Construct): StackConfig {
  const opensearchRoleArn = scope.node.tryGetContext('opensearchRoleArn');
  if (typeof opensearchRoleArn !== 'string' || opensearchRoleArn.length === 0) {
    throw new Error(
      "Missing required context value 'opensearchRoleArn'. Pass it with " +
        "`cdk deploy -c opensearchRoleArn=arn:aws:iam::<account>:role/<role-name>` " +
        'or add it to cdk.context.json.',
    );
  }
  return { opensearchRoleArn };
}
