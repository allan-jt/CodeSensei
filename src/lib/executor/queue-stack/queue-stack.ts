import * as cdk from "aws-cdk-lib";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import path = require("path");

interface QueueStackProps extends cdk.StackProps {
  readonly fargateService: ApplicationLoadBalancedFargateService;
}

export class QueueStack extends cdk.Stack {
  public readonly producerLambda: Function;
  public readonly consumerLambda: Function;
  public readonly sqsQueue: Queue;

  constructor(scope: Construct, id: string, props: QueueStackProps) {
    super(scope, id, props);

    this.sqsQueue = new Queue(this, "ExecutorSQSQueue");

    this.producerLambda = new Function(this, "ExecutorProducerLambda", {
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(path.join(__dirname, "lambda-code/producer")),
      handler: "index.handler",
      environment: {
        QUEUE_URL: this.sqsQueue.queueUrl,
      },
      timeout: cdk.Duration.seconds(10),
      functionName: "ExecutorProducerLambda",
    });

    this.consumerLambda = new Function(this, "ExecutorConsumerLambda", {
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(path.join(__dirname, "lambda-code/consumer")),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(10),
      functionName: "ExecutorConsumerLambda",
      environment: {
        SERVICE_URL: props.fargateService.loadBalancer.loadBalancerDnsName,
      },
    });

    this.sqsQueue.grantSendMessages(this.producerLambda);
    this.sqsQueue.grantConsumeMessages(this.consumerLambda);
    this.consumerLambda.addEventSource(new SqsEventSource(this.sqsQueue));
  }
}
