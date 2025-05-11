#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as dotenv from "dotenv";
import * as path from "path";
import { FrontendStack } from "../lib/frontend-stack";

dotenv.config({ path: path.join(__dirname, "../.env") });

const app = new cdk.App();
cdk.Tags.of(app).add("awsApplication", process.env.TAG_VALUE || "undefined");

new FrontendStack(app, "FrontendStack");