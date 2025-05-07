#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import * as path from "path";
import { CodeSenseiStack } from "../lib/code_sensei-stack";
import { AssessmentStack } from "../lib/assessment/assessment-stack";
import { ApiGatewayStack } from "../lib/api/api-gateway-stack";
import { FrontendStack } from "../lib/frontend/frontend-stack";
import { StorageStack } from "../lib/storage/storage-stack";
import { OpenSearchStack } from "../lib/storage/opensearch-stack/opensearch-stack";

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = new cdk.App();
cdk.Tags.of(app).add("awsApplication", process.env.TAG_VALUE || "undefined");

// Optional shared resources
new CodeSenseiStack(app, "CodeSenseiStack", {
  env: {
    region: "us-east-1",
  },
});

// In code_sensei.ts
const storageStack = new StorageStack(app, "StorageStack");

// Assessment stack with ECS + Lambda - now with OpenSearch integration
const assessmentStack = new AssessmentStack(app, "AssessmentStack", {
  env: {
    region: "us-east-1",
  },
  // Pass the OpenSearch Lambda from storage stack
  openSearchLambda: storageStack.opensearchLamba
});

// Use the bucket from storage stack
// new FrontendStack(app, "FrontendStack", {
//   bucket: storageStack.frontendBucket,
// });

// ✅ API Gateway stack connected to Lambda
new ApiGatewayStack(app, "ApiGatewayStack", {
  handler: assessmentStack.lambdaForEcs.fn, // 👈 linking across stacks
  env: {
    region: "us-east-1",
  },
});