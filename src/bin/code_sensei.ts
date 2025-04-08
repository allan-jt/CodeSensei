#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CodeSenseiStack } from "../lib/code_sensei-stack";

const app = new cdk.App();
new CodeSenseiStack(app, "CodeSenseiStack", {});
