# USPTO OpenSearch Connector CDK Package

## Overview

This AWS CDK package deploys a **Lambda function** to host the USPTO OpenSearch Connector. The function allows querying and retrieving patent-related data from an OpenSearch domain. The OpenSearch domain endpoint, region, and index information are stored in environment variables for simplicity and performance.

## Features

- **AWS Lambda**: The compute layer for querying the OpenSearch domain.
- **IAM Role-Based Permissions**: Grants least-privilege access to the OpenSearch domain using IAM policies.
- **Environment Variables**: Stores the OpenSearch domain information for runtime configuration.
- **AWS CDK v2**: Fully utilizes the latest AWS CDK features and practices.

## Requirements

1. **AWS CLI**: Installed and configured.
2. **AWS CDK v2**: Installed (`npm install -g aws-cdk`).
3. **Node.js**: Installed (for running CDK scripts).
4. **AWS Account**: With permissions to create Lambda functions and OpenSearch domains.

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
