import * as fs from 'fs';
import * as path from 'path';
import { Duration, RemovalPolicy, Stack, StackProps, DockerImage } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { loadConfig } from './config';

const VENDOR_PATH = path.join(__dirname, '..', 'vendor', 'uspto-opensearch-connector');
const FUNCTION_NAME = 'uspto-opensearch-connector';
const LAMBDA_HANDLER = 'main.java.com.samtindal.usptoconnector.handler.LambdaHandler';

export class UsptoConnectorStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const config = loadConfig(this);

    if (!fs.existsSync(path.join(VENDOR_PATH, 'build.gradle'))) {
      throw new Error(
        `Expected the connector source at ${VENDOR_PATH} but build.gradle was not found. ` +
          "Did you forget to run 'git submodule update --init --recursive'?",
      );
    }

    const logGroup = new logs.LogGroup(this, 'ConnectorFunctionLogGroup', {
      logGroupName: `/aws/lambda/${FUNCTION_NAME}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const connectorFunction = new lambda.Function(this, 'ConnectorFunction', {
      functionName: FUNCTION_NAME,
      runtime: lambda.Runtime.JAVA_21,
      handler: LAMBDA_HANDLER,
      memorySize: 1024,
      timeout: Duration.seconds(30),
      tracing: lambda.Tracing.ACTIVE,
      logGroup,
      environment: {
        OPENSEARCH_ROLE_ARN: config.opensearchRoleArn,
      },
      code: lambda.Code.fromAsset(VENDOR_PATH, {
        bundling: {
          image: DockerImage.fromRegistry('gradle:8-jdk21'),
          // CDK runs the bundling container as the host UID, which has no
          // matching /etc/passwd entry and an unwritable $HOME ("/") by
          // default — Gradle's native-services init needs a writable home
          // and fails with "Could not initialize native services" without it.
          environment: {
            HOME: '/tmp',
          },
          command: [
            'bash',
            '-c',
            'gradle shadowJar --no-daemon && cp build/libs/*-all.jar /asset-output/',
          ],
        },
      }),
    });

    connectorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['sts:AssumeRole'],
        resources: [config.opensearchRoleArn],
      }),
    );

    const accessLogGroup = new logs.LogGroup(this, 'ApiAccessLogGroup', {
      logGroupName: `/aws/apigateway/${FUNCTION_NAME}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, 'ConnectorApi', {
      restApiName: 'uspto-opensearch-connector',
      // Account-level CloudWatch role for API Gateway logging, scoped to
      // this whole AWS account/region — CDK's own construct retains it on
      // stack destroy by default (cloudWatchRoleRemovalPolicy), so deleting
      // this stack doesn't break logging for any other API in the account.
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        accessLogDestination: new apigateway.LogGroupLogDestination(accessLogGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
    });

    const integration = new apigateway.LambdaIntegration(connectorFunction);

    api.root
      .addResource('getRelatedRecordIds')
      .addMethod('GET', integration, { authorizationType: apigateway.AuthorizationType.IAM });

    api.root
      .addResource('getRecordDetails')
      .addMethod('GET', integration, { authorizationType: apigateway.AuthorizationType.IAM });
  }
}
