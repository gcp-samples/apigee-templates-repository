# Apigee Templates Repository

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Apigee](https://img.shields.io/badge/Google_Cloud-Apigee-4285F4.svg)](https://cloud.google.com/apigee)
[![Templates](https://img.shields.io/badge/Templates-117+-green.svg)](#)

Welcome to the **Apigee Templates Repository** — an enterprise catalog of modular, reusable, and battle-tested Apigee Feature Templater (`aft`) definitions, policy configurations, and cloud integration patterns.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Deploy with Jupyter Notebooks & Google Colab](#deploy-with-jupyter-notebooks--google-colab)
- [Deploy with gcloud or aft CLI](#deploy-with-gcloud-or-aft-cli)
- [Stable Features](#stable-features)
- [Draft Extension Features](#draft-extension-features)
  - [1. Google Cloud Services](#1-google-cloud-services)
  - [2. Databases & Data Stores](#2-databases--data-stores)
  - [3. AWS Cloud Services](#3-aws-cloud-services)
  - [4. Azure Cloud Services](#4-azure-cloud-services)
  - [5. SaaS & CRM Integrations](#5-saas--crm-integrations)
  - [6. Vector Databases, Search & AI](#6-vector-databases-search--ai)
  - [7. Security, Identity & Governance](#7-security-identity--governance)
  - [8. Transformation & Protocol Mediation](#8-transformation--protocol-mediation)
  - [9. Traffic Management & Observability](#9-traffic-management--observability)
- [Repository Structure](#repository-structure)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)

---

## Overview & Architecture

The Apigee Templater engine allows developers to compose enterprise API Proxies by assembling declarative **Feature YAML** definitions into unified **Templates**. Each feature encapsulates endpoints, fault rules, policies (OAuth, KVM, Service Callouts, AssignMessage, JavaScript ES5), and target connections.

```mermaid
flowchart LR
    subgraph Client [API Consumers]
        App[Mobile / Web / Partner]
    end
    subgraph Apigee [Apigee API Gateway]
        Proxy[Apigee Proxy Endpoint]
        Sec[Security & Auth Features]
        Trans[JSON/XML/BSON Mediation]
        Obs[OpenTelemetry & Metrics]
        Proxy --> Sec --> Trans --> Obs
    end
    subgraph Backends [Cloud & Enterprise Targets]
        GCP[Google Cloud: Run, BigQuery, Spanner, Firestore]
        AWS[AWS: Lambda, S3, SQS, Bedrock]
        Azure[Azure: Functions, Blobs, CosmosDB]
        SaaS[SaaS: Salesforce, Jira, ServiceNow, Stripe]
        VectorDB[Vector DBs: Pinecone, Qdrant, Weaviate]
    end
    App --> Proxy
    Obs --> GCP
    Obs --> AWS
    Obs --> Azure
    Obs --> SaaS
    Obs --> VectorDB
```

---

## Deploy with Jupyter Notebooks & Google Colab

Every template and feature in this repository includes a dedicated, runnable **Jupyter Notebook** located in the [`notebooks/`](notebooks/) directory that guides you through every step of configuration, deployment, and live API testing.

### Zero-Setup Managed Execution with Google Colab

You can run and test any feature without installing any local development tools:
1. Click the **`Open In Colab`** badge next to any feature in the [Stable Features](#stable-features) or [Draft Features](#draft-extension-features) tables below.
2. Google Colab opens the notebook directly in a managed cloud runtime.
3. Execute each cell sequentially to authenticate, deploy, and verify the feature.

### Automated Steps in Each Notebook

```mermaid
flowchart TD
    A["1. Environment Setup<br/>(Clone repo & install dependencies)"] --> B["2. GCP Authentication<br/>(google.colab.auth / Service Account)"]
    B --> C["3. Interactive Configuration<br/>(Set Project ID, Org, Env, Host & Secrets)"]
    C --> D["4. Compile & Bundle<br/>(Validate YAML & generate proxy bundle)"]
    D --> E["5. Deploy to Apigee<br/>(via gcloud beta apigee or aft)"]
    E --> F["6. Live Verification<br/>(Execute test requests & validate responses)"]
```

1. **Environment Setup**: Clones the repository and verifies required Python and CLI utilities.
2. **Google Cloud Authentication**: Authenticates your Google Cloud account via `google.colab.auth.authenticate_user()` or GCP Service Account key.
3. **Interactive Configuration Form**: Easily set parameters using Colab form fields:
   - `GOOGLE_CLOUD_PROJECT` / `APIGEE_ORG`: Your target GCP project ID.
   - `APIGEE_ENV`: Target environment (e.g., `eval`, `dev`, `prod`).
   - `APIGEE_HOST`: Hostname of your Apigee environment group (e.g., `api.example.com`).
   - Target credentials, API keys, or KVM values if required.
4. **Compilation & Packaging**: Validates the feature YAML and compiles the Apigee proxy bundle.
5. **Deployment**: Deploys the bundle directly to Apigee using `gcloud` or `aft`.
6. **Live Testing & Verification**: Sends live HTTP test requests against your deployed Apigee endpoint, printing request details, latency, and response bodies.

### Running Notebooks Locally
You can also run notebooks locally using VS Code, JupyterLab, or Cursor:
```bash
# Clone repository
git clone https://github.com/gcp-samples/apigee-templates-repository.git
cd apigee-templates-repository

# Launch JupyterLab or VS Code
jupyter lab notebooks/cloud-run-proxy.ipynb
```

---

## Deploy with gcloud or aft CLI

### 1. Deploy with `gcloud` (Google Cloud CLI)

You can import and deploy Apigee templates directly using `gcloud beta apigee apis import`:

```bash
gcloud beta apigee apis import REST-AI-Completions \
  --from-template=templates/REST-AI-Completions.yaml \
  --organization="$GOOGLE_CLOUD_PROJECT"
```

### 2. Deploy with `aft` (Apigee Feature Templater CLI)

For installation and setup of the `aft` CLI, visit the official [Apigee Feature Templater Repository](https://github.com/apigee/apigee-templater).

Deploy using the `-o NAME:ENV:SERVICE_ACCOUNT` option syntax:

```bash
# Deploy a multi-feature template bundle
aft templates/REST-AI-Completions.yaml -o $PROXY_NAME:$APIGEE_ENV:$SERVICE_ACCOUNT

# Or deploy an individual feature definition
aft features/cloud-run-proxy.yaml -o $PROXY_NAME:$APIGEE_ENV:$SERVICE_ACCOUNT
```

---

## Stable Features

Stable features available for deployment.

| Feature | Description | Category | Dependencies | Colab Notebook |
|---|---|---|---|---|
| **`ai-anthropic`** | Proxy for Anthropic Claude models with KVM credential management and header manipulation. | `AI` | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/ai-anthropic.ipynb) |
| **`ai-completions`** | Multi-provider Chat Completions API proxy supporting OpenAI, Google Cloud Vertex AI, and Anthropic targets with OpenAPI validation. | `AI` | `ai-pre-validate`, `ai-post-analytics` | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/REST-AI-Completions.ipynb) |
| **`ai-key-quota`** | Developer app group verification, token-level LLM quota enforcement, analytics data capture, and unauthorized fault handling. | `AI` | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/ai-key-quota.ipynb) |
| **`ai-post-analytics`** | Base AI & LLM response handling with token counting, cost calculation, streaming EventFlow capture, and DataCapture collectors. | `AI` | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/ai-post-analytics.ipynb) |
| **`ai-pre-validate`** | Request inspection, cross-format protocol conversion (OpenAI/Anthropic/Gemini), and intelligent model-to-target routing. | `AI` | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/ai-pre-validate.ipynb) |
| **`oas-validation`** | In-flight OpenAPI 3.0/3.1/3.2+ request validation for paths, query parameters, headers, and JSON body payloads. | `VALIDATION` | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/oas-validation.ipynb) |
| **`piimask-presidio`** | Sensitive data redaction and anonymization using Microsoft Presidio analyzer and anonymizer service callouts. | `SECURITY` | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/piimask-presidio.ipynb) |
| **`piimask-sdp`** | In-flight request and response PII inspection and de-identification using Google Cloud Sensitive Data Protection (DLP). | `SECURITY` | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/piimask-sdp.ipynb) |

---

## Draft Extension Features

> [!NOTE]
> All features below carry the `category: draft` tag to indicate that they are in active testing and integration validation. Each feature includes a dedicated Jupyter notebook in [`notebooks/`](notebooks/) that you can open and run directly in Google Colab.

### 1. Google Cloud Services

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`cloud-run-proxy`** | Proxies incoming requests to a private or public Google Cloud Run microservice with automated Google OIDC ID token minting and path routing. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-run-proxy.ipynb) |
| **`bigquery-query-proxy`** | Executes parameterized SQL queries against Google BigQuery REST API with schema flattening, row mapping, and JSON response normalization. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/bigquery-query-proxy.ipynb) |
| **`bigquery-dataset-proxy`** | Provides secure API proxying for BigQuery dataset and table metadata operations with access control and JSON structure normalization. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/bigquery-dataset-proxy.ipynb) |
| **`cloudsql-rest-proxy`** | Proxies requests to Google Cloud SQL Admin & Query APIs with IAM authentication, query payload validation, and connection error handling. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloudsql-rest-proxy.ipynb) |
| **`spanner-query-proxy`** | Executes SQL statements on Google Cloud Spanner instances via REST API with result set row-to-object JSON mapping and transaction handling. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/spanner-query-proxy.ipynb) |
| **`alloydb-rest-proxy`** | Secure proxy for Google Cloud AlloyDB for PostgreSQL clusters with connection pooling metadata, IAM token exchange, and query proxying. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/alloydb-rest-proxy.ipynb) |
| **`firestore-rest-proxy`** | Proxies Cloud Firestore REST API with bidirectional translation between Firestore typed JSON (stringValue, integerValue, mapValue) and clean standard JSON. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/firestore-rest-proxy.ipynb) |
| **`cloud-storage-json-proxy`** | Proxies Google Cloud Storage JSON API for bucket/object listing, metadata inspection, and authenticated pre-signed URL delegation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-storage-json-proxy.ipynb) |
| **`cloud-pubsub-publisher`** | Ingests incoming JSON events, encodes payloads to base64, attaches dynamic message attributes, and publishes them to Google Cloud Pub/Sub topics. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-pubsub-publisher.ipynb) |
| **`cloud-tasks-queue`** | Schedules and dispatches background tasks via Google Cloud Tasks with payload serialization, schedule time delay, and queue routing. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-tasks-queue.ipynb) |
| **`cloud-translation-proxy`** | Proxies Google Cloud Translation v3 API with source language auto-detection, response caching, and simplified string array output. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-translation-proxy.ipynb) |
| **`cloud-vision-proxy`** | Accepts base64 images or Cloud Storage URIs and queries Google Cloud Vision API for OCR text extraction, label annotations, and safe search detection. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-vision-proxy.ipynb) |
| **`cloud-speech-proxy`** | Proxies Google Cloud Speech-to-Text v2 API for synchronous and batch audio transcriptions with audio configuration validation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-speech-proxy.ipynb) |
| **`cloud-secret-manager`** | Retrieves secret payloads from Google Cloud Secret Manager with payload decoding and environment-level KVM response caching. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-secret-manager.ipynb) |
| **`cloud-logging-sink`** | Asynchronously streams structured API audit logs and execution metrics into Google Cloud Logging (Stackdriver) with severity classification. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cloud-logging-sink.ipynb) |

### 2. Databases & Data Stores

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`mongodb-atlas-data-api`** | Proxies MongoDB Atlas Data API with API Key authentication, BSON-to-JSON type translation (ObjectId, ISODate), and query filter validation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/mongodb-atlas-data-api.ipynb) |
| **`snowflake-sql-api`** | Executes SQL statements through the Snowflake SQL REST API with JWT key-pair authentication, query status polling, and row-column mapping. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/snowflake-sql-api.ipynb) |
| **`redis-rest-upstash`** | Proxies Redis key-value commands (GET, SET, HGETALL, LPUSH, PIPELINE) via HTTP REST interface with token authentication and response formatting. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/redis-rest-upstash.ipynb) |
| **`couchdb-proxy`** | Proxies Apache CouchDB / IBM Cloudant REST endpoints with Basic Auth injection, revision ID tracking, and Mango query translation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/couchdb-proxy.ipynb) |
| **`neo4j-rest-proxy`** | Executes Cypher graph queries over the Neo4j HTTP Transaction API with graph node/relationship JSON serialization. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/neo4j-rest-proxy.ipynb) |
| **`cassandra-stargate-proxy`** | Proxies Apache Cassandra / DataStax Astra Stargate Document API with token lifecycle handling and CQL-to-JSON object mapping. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cassandra-stargate-proxy.ipynb) |
| **`dynamodb-rest-proxy`** | Translates high-level JSON requests to AWS DynamoDB low-level attribute format ({S: 'val', N: '123'}) and unmarshals query responses. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/dynamodb-rest-proxy.ipynb) |
| **`cosmosdb-rest-proxy`** | Proxies Azure Cosmos DB SQL API with master key authorization token calculation, partition key header routing, and document querying. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cosmosdb-rest-proxy.ipynb) |
| **`clickhouse-http-proxy`** | Proxies analytical queries to ClickHouse HTTP interface with FORMAT JSON extraction, compression support, and query timeout enforcement. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/clickhouse-http-proxy.ipynb) |
| **`faunadb-graphql-proxy`** | Proxies FaunaDB HTTP GraphQL & FQL endpoints with Secret Key injection and cursor-based pagination normalization. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/faunadb-graphql-proxy.ipynb) |
| **`planetscale-database-proxy`** | Proxies PlanetScale Serverless MySQL API with Service Token authentication, transactional session headers, and structured error reporting. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/planetscale-database-proxy.ipynb) |
| **`supabase-postgrest-proxy`** | Proxies Supabase / PostgREST RESTful database endpoints with JWT verification, RLS (Row Level Security) role forwarding, and filter translation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/supabase-postgrest-proxy.ipynb) |

### 3. AWS Cloud Services

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`aws-lambda-proxy`** | Invokes AWS Lambda functions directly via AWS REST API using AWS Signature Version 4 (SigV4) authentication with synchronous and asynchronous invocation modes. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-lambda-proxy.ipynb) |
| **`aws-s3-proxy`** | Proxies Amazon S3 REST API for object retrieval, upload mediation, and bucket listing with AWS SigV4 authorization. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-s3-proxy.ipynb) |
| **`aws-sqs-proxy`** | Sends JSON messages to AWS Simple Queue Service (SQS) queues with automatic SigV4 signing, message deduplication IDs, and delay configuration. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-sqs-proxy.ipynb) |
| **`aws-sns-proxy`** | Publishes structured push notifications and broadcast alerts to Amazon Simple Notification Service (SNS) topics with message attributes. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-sns-proxy.ipynb) |
| **`aws-eventbridge-proxy`** | Ingests custom enterprise application events into AWS EventBridge event buses with schema validation and SigV4 authentication. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-eventbridge-proxy.ipynb) |
| **`aws-stepfunctions-proxy`** | Starts workflow executions on AWS Step Functions state machines with input validation, idempotency token generation, and execution status tracking. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-stepfunctions-proxy.ipynb) |
| **`aws-kinesis-proxy`** | Ingests real-time high-throughput streaming records into Amazon Kinesis Data Streams with partition key hashing and SigV4 signing. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-kinesis-proxy.ipynb) |
| **`aws-bedrock-proxy`** | Proxies AWS Bedrock Converse and InvokeModel endpoints for Claude, Titan, and Llama models with SigV4 authentication and token usage capture. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-bedrock-proxy.ipynb) |
| **`aws-secretsmanager-proxy`** | Fetches secrets from AWS Secrets Manager using SigV4 authorization with local in-memory/KVM caching to reduce AWS API call frequency. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-secretsmanager-proxy.ipynb) |
| **`aws-ses-email-proxy`** | Sends transactional emails via AWS Simple Email Service (SES) v2 REST API with HTML sanitization, sender verification, and SigV4 signing. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/aws-ses-email-proxy.ipynb) |

### 4. Azure Cloud Services

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`azure-functions-proxy`** | Proxies incoming API calls to serverless Azure Functions with automated Function Key injection (x-functions-key) or Entra ID OAuth token injection. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-functions-proxy.ipynb) |
| **`azure-blob-storage-proxy`** | Proxies Azure Blob Storage REST API with Shared Access Signature (SAS) token generation and container object operations. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-blob-storage-proxy.ipynb) |
| **`azure-service-bus-proxy`** | Sends messages to Azure Service Bus Queues and Topics using SAS token authentication (SharedAccessSignature) with message properties. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-service-bus-proxy.ipynb) |
| **`azure-event-grid-proxy`** | Publishes CloudEvents 1.0 compliant JSON events to Azure Event Grid topics with SAS key or token authentication. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-event-grid-proxy.ipynb) |
| **`azure-key-vault-proxy`** | Retrieves secrets and certificates from Azure Key Vault REST API using Entra ID OAuth tokens with Apigee response caching. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-key-vault-proxy.ipynb) |
| **`azure-openai-proxy`** | Proxies Azure OpenAI model deployments (GPT-4o, GPT-3.5-Turbo) with api-key header injection, rate limit monitoring, and usage tracking. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-openai-proxy.ipynb) |
| **`azure-cognitive-search`** | Proxies Azure AI Search (formerly Cognitive Search) index querying and document updates with api-key authentication and result formatting. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-cognitive-search.ipynb) |
| **`azure-logic-apps-proxy`** | Triggers automated workflows in Azure Logic Apps via HTTP POST trigger endpoints with signature verification and payload normalization. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-logic-apps-proxy.ipynb) |
| **`azure-sql-rest-proxy`** | Proxies Azure SQL Database management and elastic pool REST APIs with Entra ID bearer token authentication and resource filtering. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-sql-rest-proxy.ipynb) |
| **`azure-event-hubs-proxy`** | Streams event telemetry batches into Azure Event Hubs with partition key distribution, SAS token signing, and JSON batching. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/azure-event-hubs-proxy.ipynb) |

### 5. SaaS & CRM Integrations

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`salesforce-rest-proxy`** | Proxies Salesforce REST API and SOQL queries with automatic OAuth2 access token refresh, instance URL routing, and record transformation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/salesforce-rest-proxy.ipynb) |
| **`jira-rest-proxy`** | Proxies Atlassian Jira Cloud REST API v3 for issue creation, JQL search, and sprint updates with Basic Auth / API token injection. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/jira-rest-proxy.ipynb) |
| **`servicenow-table-proxy`** | Proxies ServiceNow Table API for incident tracking, change requests, and CMDB records with OAuth/Basic Auth and sysparm validation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/servicenow-table-proxy.ipynb) |
| **`hubspot-crm-proxy`** | Proxies HubSpot CRM v3 REST API with private app token authentication, rate limit backoff handling, and property mapping. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/hubspot-crm-proxy.ipynb) |
| **`zendesk-support-proxy`** | Proxies Zendesk Support REST API v2 for ticket creation, comments, and user management with API token authentication. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/zendesk-support-proxy.ipynb) |
| **`workday-raas-proxy`** | Proxies Workday RaaS endpoints with ISU (Integration System User) credentials, XML-to-JSON reporting conversion, and pagination. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/workday-raas-proxy.ipynb) |
| **`sap-odata-proxy`** | Mediates between modern REST JSON clients and SAP S/4HANA OData v2/v4 services with CSRF token fetching and OData response unwrapping. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/sap-odata-proxy.ipynb) |
| **`slack-webhook-proxy`** | Transforms simple alerts into Slack Block Kit interactive message payloads and dispatches them via Slack Webhooks or Web API. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/slack-webhook-proxy.ipynb) |
| **`msteams-webhook-proxy`** | Accepts incident alerts and formats them into Microsoft Teams Adaptive Cards 1.4 JSON payloads sent to Office 365 Incoming Webhooks. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/msteams-webhook-proxy.ipynb) |
| **`stripe-payments-proxy`** | Proxies Stripe REST API for PaymentIntents, Customers, and Charges with Secret Key injection, Idempotency-Key propagation, and error mapping. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/stripe-payments-proxy.ipynb) |
| **`twilio-sms-proxy`** | Dispatches SMS messages via Twilio Messaging API with E.164 phone number validation, Basic Auth credentials, and URL-encoded body transformation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/twilio-sms-proxy.ipynb) |
| **`sendgrid-mail-proxy`** | Proxies SendGrid v3 Mail Send API with Bearer token injection, recipient list deduplication, and template ID mapping. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/sendgrid-mail-proxy.ipynb) |
| **`github-api-proxy`** | Proxies GitHub REST API with Personal Access Token (PAT) / GitHub App installation token injection, User-Agent header compliance, and rate limit tracking. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/github-api-proxy.ipynb) |
| **`gitlab-api-proxy`** | Proxies GitLab Projects, Pipelines, and Issues REST API with PRIVATE-TOKEN header injection and project ID URL-encoding. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/gitlab-api-proxy.ipynb) |
| **`pagerduty-events-proxy`** | Ingests incident triggers, acknowledgments, and resolutions into PagerDuty Events API v2 with routing key injection and payload validation. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/pagerduty-events-proxy.ipynb) |
| **`okta-management-proxy`** | Proxies Okta Management API for user provisioning, group management, and factor enrollment with SSWS API token authentication. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/okta-management-proxy.ipynb) |

### 6. Vector Databases, Search & AI

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`pinecone-vector-proxy`** | Proxies Pinecone Vector DB REST API for vector upserts, semantic similarity queries, and namespace filtering with Api-Key header injection. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/pinecone-vector-proxy.ipynb) |
| **`qdrant-vector-proxy`** | Proxies Qdrant Vector Search engine REST API for nearest-neighbor point search, payload filtering, and batch embedding insertion with api-key authentication. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/qdrant-vector-proxy.ipynb) |
| **`weaviate-vector-proxy`** | Proxies Weaviate Vector Database GraphQL & REST v1 objects API with Bearer token authentication and NearText / NearVector query formatting. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/weaviate-vector-proxy.ipynb) |
| **`milvus-vector-proxy`** | Proxies Milvus v2 / Zilliz Cloud vector search REST API with Bearer token authentication, output field selection, and vector search parameters. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/milvus-vector-proxy.ipynb) |
| **`chroma-vector-proxy`** | Proxies Chroma Open-Source / Hosted Vector DB REST API v1 for collection querying, embedding storage, and metadata filtering. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/chroma-vector-proxy.ipynb) |
| **`vertex-ai-search-proxy`** | Proxies Google Cloud Vertex AI Search & Conversation (Agent Builder) data store query API with Google OAuth token injection and citation parsing. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/vertex-ai-search-proxy.ipynb) |
| **`elasticsearch-rest-proxy`** | Proxies Elasticsearch and OpenSearch `_search` queries with Basic/API key auth, DSL query validation, and hit extraction. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/elasticsearch-rest-proxy.ipynb) |
| **`cohere-generate-proxy`** | Proxies Cohere v1 /chat and /embed endpoints with Bearer token authentication, input validation, and token billing capture. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cohere-generate-proxy.ipynb) |
| **`mistral-ai-proxy`** | Proxies Mistral AI models (mistral-large, mistral-small, mistral-embed) with Bearer token authentication and token analytics capture. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/mistral-ai-proxy.ipynb) |
| **`groq-inference-proxy`** | Proxies GroqCloud ultra-fast OpenAI-compatible LLM inference API with Bearer token authentication and latency monitoring. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/groq-inference-proxy.ipynb) |
| **`replicate-predictions-proxy`** | Dispatches machine learning model predictions to Replicate REST API with Bearer token authentication, webhook URL attachment, and status polling. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/replicate-predictions-proxy.ipynb) |
| **`ollama-local-proxy`** | Proxies on-premise or VPC self-hosted Ollama model instances (/api/generate, /api/chat) with request authentication and payload normalization. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/ollama-local-proxy.ipynb) |

### 7. Security, Identity & Governance

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`oauth2-token-exchange`** | Implements RFC 8693 OAuth 2.0 Token Exchange to securely swap external IDP tokens (Okta, Azure AD, Cognito) for internal Apigee / GCP access tokens. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/oauth2-token-exchange.ipynb) |
| **`jwt-claims-transformer`** | Parses and verifies incoming JSON Web Tokens (JWT), extracts nested custom claims, and injects them as HTTP headers for backend microservices. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/jwt-claims-transformer.ipynb) |
| **`hmac-auth-validator`** | Validates incoming HTTP request HMAC-SHA256 signatures against request headers, timestamp, nonce, and payload hash with clock-skew defense. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/hmac-auth-validator.ipynb) |
| **`api-key-dynamic-lookup`** | Performs dynamic multi-tenant API key resolution against encrypted KVM or external IDP with tier-based rate limit assignment. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/api-key-dynamic-lookup.ipynb) |
| **`mtls-client-cert-auth`** | Inspects mTLS client certificate attributes (Subject DN, SAN, Issuer, Serial Number, Fingerprint) and enforces organizational identity policies. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/mtls-client-cert-auth.ipynb) |
| **`ip-whitelist-geofencing`** | Enforces strict CIDR subnet IP whitelisting and country-level geofencing rules using True-Client-IP and X-Forwarded-For headers. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/ip-whitelist-geofencing.ipynb) |
| **`content-safety-sanitizer`** | Inspects incoming JSON payloads in-flight for SQL injection, Cross-Site Scripting (XSS), command injection, and malicious unicode patterns. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/content-safety-sanitizer.ipynb) |
| **`webhook-stripe-verifier`** | Verifies incoming Stripe webhook `Stripe-Signature` headers (t=timestamp, v1=signature) using HMAC-SHA256 and rejects expired replay attacks. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/webhook-stripe-verifier.ipynb) |
| **`webhook-github-verifier`** | Verifies `X-Hub-Signature-256` headers on incoming GitHub Webhooks against a shared secret before routing to internal build workers. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/webhook-github-verifier.ipynb) |
| **`webhook-shopify-verifier`** | Validates `X-Shopify-Hmac-Sha256` signatures on Shopify store webhooks (orders/create, customers/update) with payload integrity checking. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/webhook-shopify-verifier.ipynb) |
| **`cors-policy-customizer`** | Handles CORS preflight OPTIONS requests dynamically with multi-origin regex allowlists, custom allowed headers, and credentials forwarding. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/cors-policy-customizer.ipynb) |
| **`pii-regex-redactor`** | High-performance in-flight JavaScript regex sanitizer redacting Social Security Numbers (SSN), Credit Cards, and emails from request/response bodies. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/pii-regex-redactor.ipynb) |

### 8. Transformation & Protocol Mediation

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`soap-to-rest-translator`** | Transforms clean incoming REST JSON requests into legacy SOAP 1.1/1.2 XML Envelopes with XML namespaces, and parses SOAP responses back to JSON. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/soap-to-rest-translator.ipynb) |
| **`json-to-xml-translator`** | Converts incoming JSON payloads to XML format using Apigee JSONtoXML policies and transforms backend XML responses back into clean JSON. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/json-to-xml-translator.ipynb) |
| **`graphql-rest-wrapper`** | Wraps complex backend GraphQL endpoints into clean, predictable RESTful resource endpoints (/users/{id}/orders) for mobile and web clients. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/graphql-rest-wrapper.ipynb) |
| **`grpc-web-rest-transcoder`** | Accepts standard REST JSON requests, converts payloads into Protobuf binary or gRPC-Web JSON format, and calls gRPC-Web proxy backends. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/grpc-web-rest-transcoder.ipynb) |
| **`csv-to-json-transformer`** | Parses incoming multipart or raw CSV data streams and translates records into structured JSON object arrays with header detection. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/csv-to-json-transformer.ipynb) |
| **`xml-json-path-extractor`** | Extracts targeted fields from large complex XML or JSON request/response bodies using XPath/JSONPath and sets flow variables for routing. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/xml-json-path-extractor.ipynb) |
| **`gzip-brotli-mediator`** | Handles Accept-Encoding negotiation, decompressing payloads on ingest when required and compressing upstream responses for bandwidth savings. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/gzip-brotli-mediator.ipynb) |
| **`multipart-form-parser`** | Parses multipart/form-data boundary payloads, extracts text fields and binary file metadata, and converts the request into structured JSON. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/multipart-form-parser.ipynb) |
| **`response-field-masker`** | Implements client-driven sparse fieldsets (`?fields=id,name,email,address.city`) to filter and mask large JSON response objects at the gateway. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/response-field-masker.ipynb) |
| **`api-version-mediator`** | Normalizes API versioning across Header (`Accept-Version: v2`), Query (`?v=2`), and Path (`/v2/`), injecting Sunset & Deprecation RFC 8594 headers. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/api-version-mediator.ipynb) |

### 9. Traffic Management & Observability

| Feature ID | Description | Dependencies | Colab Notebook |
|---|---|---|---|
| **`rate-limit-dynamic-kvm`** | Enforces dynamic per-minute and per-day rate limits resolved dynamically from KVM based on consumer plan (Bronze, Silver, Gold, Platinum). | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/rate-limit-dynamic-kvm.ipynb) |
| **`spike-arrest-burst-smoother`** | Protects backend microservices from sudden traffic spikes and DDoS surges using Apigee SpikeArrest and ConcurrentRateLimit policies. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/spike-arrest-burst-smoother.ipynb) |
| **`circuit-breaker-failover`** | Monitors target HTTP 5xx error rates and timeouts, tripping a circuit breaker to divert traffic to a cached fallback or secondary datacenter. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/circuit-breaker-failover.ipynb) |
| **`response-cache-invalidation`** | Caches GET query responses using Apigee ResponseCache policy, with support for instant cache invalidation on PUT/POST/DELETE mutations. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/response-cache-invalidation.ipynb) |
| **`multi-region-load-balancer`** | Distributes incoming traffic across multiple GCP regions (us-central1, europe-west1, asia-east1) with weighted round-robin and health failover. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/multi-region-load-balancer.ipynb) |
| **`opentelemetry-trace-exporter`** | Propagates W3C TraceContext (`traceparent`, `tracestate`) headers and exports distributed span telemetry to an OpenTelemetry collector. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/opentelemetry-trace-exporter.ipynb) |
| **`datadog-metrics-forwarder`** | Extracts latency, status codes, and error categories from each transaction and pushes metric series to Datadog v2 Metrics API via Service Callout. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/datadog-metrics-forwarder.ipynb) |
| **`splunk-hec-forwarder`** | Captures sanitized request/response metadata and security audit logs, streaming JSON events into Splunk HEC with Splunk token auth. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/splunk-hec-forwarder.ipynb) |
| **`dynatrace-rum-injector`** | Injects Dynatrace OneAgent correlation headers (`x-dynatrace-test`) and Server-Timing performance breakdown metrics in responses. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/dynatrace-rum-injector.ipynb) |
| **`synthetic-health-monitor`** | Provides an automated `/healthz` & `/readyz` endpoint that executes parallel health probes against downstream targets, KVMs, and caches. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/synthetic-health-monitor.ipynb) |
| **`mock-faker-service`** | Generates realistic, dynamic mock JSON responses (users, transactions, products, addresses) at the Apigee edge without calling backend targets. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/mock-faker-service.ipynb) |
| **`request-replay-recorder`** | Captures failed client requests (HTTP 5xx, timeouts) and forwards the original method, headers, and body to a Google Cloud Pub/Sub DLQ for replay. | None (Standalone) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/gcp-samples/apigee-templates-repository/blob/main/notebooks/request-replay-recorder.ipynb) |

---

## Repository Structure
```
├── features/        # Modular Apigee Feature YAML definitions
├── templates/       # Multi-feature composite API proxy templates
├── notebooks/       # Google Colab runnable test & deployment notebooks
├── src/             # ES5 JavaScript utilities & schema validators
└── tests/           # Unit and integration test suites
```

---

## Contributing
1. Fork the repository.
2. Add new feature YAMLs to `features/` with `category: draft`.
3. Create a corresponding Jupyter Notebook in `notebooks/`.
4. Run `npm test` to ensure all tests pass.
5. Submit a Pull Request.

---

## License
This project is licensed under the [Apache 2.0 License](LICENSE).

---

## Disclaimer

This is not an officially supported Google product. This repository is provided without warranty or support.
