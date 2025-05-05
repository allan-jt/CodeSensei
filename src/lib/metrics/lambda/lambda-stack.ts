import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Queue } from "aws-cdk-lib/aws-sqs";
import * as path from "path";

interface MetricsLambdaStackProps extends cdk.StackProps {
    lambdaName1: string;
    lambdaName2: string;
    lambdaName3: string;
    loadBalancer: ApplicationLoadBalancedFargateService;
    sqsQueue: Queue;
}

export class MetricsLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: MetricsLambdaStackProps) {
        super(scope, id, props);
        
        const { lambdaName1, lambdaName2, lambdaName3, loadBalancer, sqsQueue } = props;

        const lf4_0 = new Function(this, "LF4_0", {
            functionName: lambdaName1,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_0")),
            handler: "index.handler"
        });
        
        const lf4_1 = new Function(this, "LF4_1", {
            functionName: lambdaName2,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_1")),
            handler: "index.handler",
            environment: {
                REQUEST_URL: loadBalancer.loadBalancer.loadBalancerDnsName,
                SQS_QUEUE_URL: sqsQueue.queueUrl,
            }
        });
        
        const lf4_2 = new Function(this, "LF4_2", {
            functionName: lambdaName3,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_2")),
            handler: "index.handler"
        });

        // Add permissions
        sqsQueue.grantSendMessages(lf4_1);
    }
}