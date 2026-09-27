import { App } from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { UsptoConnectorStack } from '../lib/uspto-connector-stack';

function synthTemplate(context: Record<string, unknown> = {}): Template {
  const app = new App({
    context: {
      opensearchRoleArn: 'arn:aws:iam::123456789012:role/opensearch-access',
      'aws:cdk:bundling-stacks': [],
      '@aws-cdk/aws-apigateway:disableCloudWatchRole': true,
      ...context,
    },
  });
  const stack = new UsptoConnectorStack(app, 'TestStack');
  return Template.fromStack(stack);
}

describe('UsptoConnectorStack', () => {
  test('creates a Java 21 Lambda function with the connector handler', () => {
    const template = synthTemplate();
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'java21',
      Handler: 'main.java.com.samtindal.usptoconnector.handler.LambdaHandler',
    });
  });

  test('grants the Lambda role permission to assume the OpenSearch role', () => {
    const template = synthTemplate();
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Resource: 'arn:aws:iam::123456789012:role/opensearch-access',
          }),
        ]),
      }),
    });
  });

  test('sets explicit log retention instead of never-expire', () => {
    const template = synthTemplate();
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/lambda/uspto-opensearch-connector',
      RetentionInDays: 30,
    });
  });

  test('configures an account-level CloudWatch role for API Gateway logging', () => {
    const template = synthTemplate();
    template.resourceCountIs('AWS::ApiGateway::Account', 1);
  });

  test('requires IAM authorization on both routes', () => {
    const template = synthTemplate();
    const methods = template.findResources('AWS::ApiGateway::Method', {
      Properties: { HttpMethod: 'GET' },
    });
    const authTypes = Object.values(methods).map((m: any) => m.Properties.AuthorizationType);
    expect(authTypes.sort()).toEqual(['AWS_IAM', 'AWS_IAM']);
  });

  test('exposes both connector routes', () => {
    const template = synthTemplate();
    const resources = template.findResources('AWS::ApiGateway::Resource');
    const pathParts = Object.values(resources).map((r: any) => r.Properties.PathPart);
    expect(pathParts).toEqual(
      expect.arrayContaining(['getRelatedRecordIds', 'getRecordDetails']),
    );
  });

  test('throws a clear error when opensearchRoleArn context is missing', () => {
    const app = new App({ context: { 'aws:cdk:bundling-stacks': [] } });
    expect(() => new UsptoConnectorStack(app, 'TestStack')).toThrow(/opensearchRoleArn/);
  });
});
