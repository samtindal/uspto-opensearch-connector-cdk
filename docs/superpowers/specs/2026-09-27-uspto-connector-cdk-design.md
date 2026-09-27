# USPTO OpenSearch Connector CDK — Design

## Purpose

`samtindal/uspto-opensearch-connector` (Java 21, Gradle) implements a Lambda
handler that fronts an externally-hosted USPTO OpenSearch data store via
`GetRelatedRecordIdsActivity` and `GetRecordDetailsActivity`, but has no
infrastructure code. This repo (`uspto-opensearch-connector-cdk`) is the AWS
CDK v2 (TypeScript) package that deploys it: Lambda + API Gateway REST API,
wired for IAM-authenticated invocation, matching the access model described
in the connector's README ("API permissions are enforced via IAM roles
assumed by the calling application").

## Non-goals

- Does not provision the OpenSearch domain itself — it is external/public
  infrastructure this stack only needs an assumable role ARN for.
- No multi-region/multi-stage `Stage` construct scaffolding. Single stack,
  single deployment target, parameterized by CDK context. Structured so a
  `Stage` wrapper is a small addition later, not a rewrite.
- No changes to the connector's Lambda business logic — only a build-system
  addition (Shadow plugin) needed to produce a Lambda-deployable fat jar.

## Architecture

```
Caller (assumes IAM role) ──SigV4──▶ API Gateway (REST API, AWS_IAM auth)
                                            │ Lambda proxy integration
                                            ▼
                                 Lambda (Java 21, LambdaHandler)
                                            │ sts:AssumeRole
                                            ▼
                             External USPTO OpenSearch access role
                                   (ARN supplied via context)
```

Two REST resources, both proxying to the same Lambda:
- `GET /getRelatedRecordIds`
- `GET /getRecordDetails`

CloudWatch Logs with explicit retention on both the Lambda and the API
stage's access logs. X-Ray tracing enabled on the Lambda and the API stage.

## Source linkage

The connector's Java source is added as a git submodule at
`vendor/uspto-opensearch-connector`, pinned to a specific commit. This keeps
the two repos independently versioned while giving the CDK app a
reproducible, self-contained build input (no assumption about sibling
checkout layout).

A small, separately-scoped change is made to
`samtindal/uspto-opensearch-connector`'s `build.gradle`: add the
[Shadow plugin](https://github.com/GradleUp/shadow)
(`id 'com.github.johnrengelman.shadow' version '8.1.1'`) so
`./gradlew shadowJar` produces a fat jar bundling `aws-lambda-java-core`,
`aws-lambda-java-events`, slf4j/logback, and httpclient5 — none of which are
present on the Lambda Java runtime by default. This is the minimum viable
change to make the existing handler deployable; no other files in that repo
are touched.

## CDK stack

`lib/uspto-connector-stack.ts` defines `UsptoConnectorStack`:

- **Lambda**: `lambda.Function`, `runtime: JAVA_21`, `handler:
  'main.java.com.samtindal.usptoconnector.handler.LambdaHandler::handleRequest'`
  (matches the package-qualified class name in the source — note the
  `main.java.` prefix baked into the existing package declaration).
  `code: lambda.Code.fromAsset('vendor/uspto-opensearch-connector', { bundling:
  { image: DockerImage.fromRegistry('gradle:8-jdk21'), command: ['bash',
  '-c', './gradlew shadowJar --no-daemon && cp build/libs/*-all.jar
  /asset-output/'] } })`. Memory/timeout sized for a JVM cold start (1024 MB,
  30s timeout — Lambda SnapStart is out of scope for this pass).
- **Execution role**: base `AWSLambdaBasicExecutionRole` plus an inline
  policy granting `sts:AssumeRole` on the context-supplied
  `opensearchRoleArn`. The ARN is also passed to the function as an
  `OPENSEARCH_ROLE_ARN` environment variable so the handler can assume it at
  runtime (the connector code doesn't do this yet — tracked as a gap, not
  blocking this infra work, since the activities currently return simulated
  data).
- **REST API**: `apigateway.RestApi`, `deployOptions: { tracingEnabled: true,
  loggingLevel: INFO }`. Two `GET` methods (`/getRelatedRecordIds`,
  `/getRecordDetails`), each `authorizationType:
  apigateway.AuthorizationType.IAM`, Lambda proxy integration.
- **Config**: `lib/config.ts` reads `opensearchRoleArn` from CDK context
  (`this.node.tryGetContext('opensearchRoleArn')`), throwing a clear synth-time
  error if absent. Account/region come from the standard
  `CDK_DEFAULT_ACCOUNT`/`CDK_DEFAULT_REGION` env vars via `bin/app.ts`.

## Testing

`test/uspto-connector-stack.test.ts` using `aws-cdk-lib/assertions`:
asserts both REST resources exist with `AWS_IAM` auth, Lambda runtime is
`java21`, log retention is explicitly set (not "never expire" default), and
the execution role's inline policy references the context-supplied ARN.

## CI/CD

`.github/workflows/cdk.yml`:
- Trigger: `pull_request` → checkout with `submodules: recursive`, Node
  setup, `npm ci`, `cdk synth`, `cdk diff`.
- Trigger: `push` to `main` → same setup, `cdk deploy --require-approval
  never`, gated behind a GitHub Environment (no AWS credentials wired up in
  this pass — added when real deploy credentials exist).

## Documentation

`README.md` is rewritten to describe the actual architecture (replacing the
current stale placeholder that references a nonexistent Python handler and
a different directory layout), including an architecture diagram (Mermaid,
renders natively on GitHub) covering the caller → API Gateway → Lambda →
assumed-role → OpenSearch flow, plus setup/deploy instructions (submodule
init, context parameter, `cdk deploy`).

## Open follow-ups (explicitly out of scope here)

- The connector's `OpenSearchClientWrapper` still returns simulated data and
  doesn't actually call OpenSearch or assume `OPENSEARCH_ROLE_ARN` — that's
  application code in the other repo, not infra.
- No custom domain / API key / usage plan — add if/when this moves beyond a
  portfolio deployment.
