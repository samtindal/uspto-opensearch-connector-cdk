# USPTO OpenSearch Connector CDK Package

## Overview

This AWS CDK package deploys a **Lambda function** to host the USPTO OpenSearch Connector. The function allows querying and retrieving patent-related data from an OpenSearch domain, leveraging IAM role-based permissions for secure access. The package follows **AWS CDK v2 best practices**, including secure management of sensitive constants such as the OpenSearch domain endpoint and region.

## Features

- **AWS Lambda**: The compute layer for querying the OpenSearch domain.
- **IAM Role-Based Permissions**: Grants least-privilege access to the OpenSearch domain using IAM policies.
- **Secure Constants Handling**: Incorporates AWS Secrets Manager and AWS Systems Manager Parameter Store to securely manage sensitive constants like the OpenSearch endpoint and region.
- **Environment Variables**: Dynamically configures the Lambda function with OpenSearch domain information.
- **AWS CDK v2**: Fully utilizes the latest AWS CDK features and practices.

## Requirements

1. **AWS CLI**: Installed and configured.
2. **AWS CDK v2**: Installed (`npm install -g aws-cdk`).
3. **Node.js**: Installed (for running CDK scripts).
4. **AWS Account**: With permissions to create Lambda functions, Secrets Manager secrets, and OpenSearch domains.

## Directory Structure

```plaintext
uspto-opensearch-cdk/
├── bin/
│   └── uspto-opensearch-cdk.ts       # CDK app entry point
├── lib/
│   └── uspto-opensearch-cdk-stack.ts # CDK stack definition
├── lambda/
│   └── handler.py                    # Python Lambda handler logic
├── cdk.json                          # CDK configuration
├── package.json                      # Node.js dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Project documentation
