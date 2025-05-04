#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import * as path from "path";
import { CodeSenseiStack } from "../lib/code_sensei-stack";
import { AssessmentStack } from "../lib/assessment/assessment-stack";
import { ApiGatewayStack } from "../lib/api/api-gateway-stack";
import { FrontendStack } from "../lib/frontend/frontend-stack";

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = new cdk.App();
cdk.Tags.of(app).add("awsApplication", process.env.TAG_VALUE || "undefined");

// Optional shared resources
new CodeSenseiStack(app, "CodeSenseiStack", {
  env: {
    region: "us-east-1",
  },
});

// ✅ Assessment stack with ECS + Lambda 
const assessmentStack = new AssessmentStack(app, "AssessmentStack", {
  env: {
    region: "us-east-1",
  },
});

const storageStack = new StorageStack(app, "StorageStack");

// Use the bucket from storage stack
new FrontendStack(app, "FrontendStack", {
  bucket: storageStack.frontendBucket,
});

// ✅ API Gateway stack connected to Lambda
new ApiGatewayStack(app, "ApiGatewayStack", {
  handler: assessmentStack.lambdaForEcs.fn, // 👈 linking across stacks
  env: {
    region: "us-east-1",
  },
});