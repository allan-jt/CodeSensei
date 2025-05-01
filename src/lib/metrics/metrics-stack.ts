import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { MetricsLambdaStack } from "./lambda/lambda-stack";
import { MetricsEcsStack } from "./ecs/ecs-stack";
import { MetricsSqsStack } from "./sqs/sqs-stack";

export class MetricsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        const appName = "CodeSensei";
        const lambdaStack = new MetricsLambdaStack(this, "MetricsLambdaStack", { stackName: `${appName}MetricsLambdaStack` });
        const ecsStack = new MetricsEcsStack(this, "MetricsEcsStack", { stackName: `${appName}MetricsEcsStack` });
        const sqsStack = new MetricsSqsStack(this, "MetricsSqsStack", { stackName: `${appName}MetricsSqsStack` });
    }
}