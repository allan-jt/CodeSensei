import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Queue } from "aws-cdk-lib/aws-sqs";

export class MetricsSqsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const appName = "CodeSensei";

        const metricsQueue = new Queue(this, "MetricsQueue", {
            queueName: `${appName}MetricsQueue`
        });
    }
}