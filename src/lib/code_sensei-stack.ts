import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StorageStack } from "./storage/storage-stack";
import { MetricsStack } from "./metrics/metrics-stack";

export class CodeSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = "CodeSensei";
    const storage = new StorageStack(this, "StorageStack", { stackName: `${appName}StorageStack` });
    const metrics = new MetricsStack(this, "MetricsStack", {
      stackName: `${appName}MetricsStack`,
      metricsTable: storage.metricsTable
    });
  }
}