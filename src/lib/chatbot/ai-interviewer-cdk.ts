#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { InterviewAiCombinedStack } from "../lib/ai-interviewer-cdk-stack";  // ✅ 改类名

const app = new cdk.App();
new InterviewAiCombinedStack(app, "InterviewAiCombinedStack", {   // ✅ 改实例化类名
  env: { region: "us-east-1" },
});