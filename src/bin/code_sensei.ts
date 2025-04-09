#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CodeSenseiStack } from "../lib/code_sensei-stack";
import { DynamoStack } from "../lib/storage/dynamo-stack";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = new cdk.App();
cdk.Tags.of(app).add("awsApplication", process.env.TAG_VALUE || "undefined");

new CodeSenseiStack(app, "CodeSenseiStack", {}); // For test purposes; remove later
new DynamoStack(app, "DynamoStack", {});
