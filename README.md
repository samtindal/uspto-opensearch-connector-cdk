# USPTO OpenSearch Connector CDK Package

## Overview

This AWS CDK package deploys an **AWS Lambda function** to host the USPTO OpenSearch Connector. The function allows querying and retrieving patent-related data from an OpenSearch domain using IAM role-based permissions. The package automates the deployment of the Lambda function, its permissions, and configuration.

## Features

- **AWS Lambda**: The compute layer for querying the OpenSearch domain.
- **IAM Role Permissions**: Uses role-based access for interacting with OpenSearch, ensuring secure and controlled access.
- **Environment Variables**: Configures the OpenSearch domain endpoint and region dynamically.
- **Python Lambda Handler**: Implements the logic for querying and retrieving data from OpenSearch.

## Requirements

1. **AWS CLI**: Installed and configured.
2. **AWS CDK**: Installed (`npm install -g aws-cdk`).
3. **Node.js**: Installed (for running CDK scripts).
4. **AWS Account**: With permissions to create Lambda functions and manage OpenSearch domains.

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
