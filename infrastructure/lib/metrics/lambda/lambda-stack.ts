import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

interface MetricsLambdaStackProps extends cdk.StackProps {
  lambdaName1: string;
  lambdaName2: string;
  lambdaName3: string;
  loadBalancer: ApplicationLoadBalancedFargateService;
  sqsQueue: Queue;
  metricsTable: TableV2;
  assessmentsTable: TableV2;
}

export class MetricsLambdaStack extends cdk.Stack {
  public readonly lf4_0: Function;
  public readonly lf4_1: Function;

  constructor(scope: Construct, id: string, props: MetricsLambdaStackProps) {
    super(scope, id, props);

    const {
      lambdaName1,
      lambdaName2,
      lambdaName3,
      loadBalancer,
      sqsQueue,
      metricsTable,
      assessmentsTable,
    } = props;

    this.lf4_0 = new Function(this, "LF4_0", {
      functionName: lambdaName1,
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(path.join(__dirname, "lf4_0")),
      handler: "index.handler",
      environment: {
        METRICS_TABLE_NAME: metricsTable.tableName,
        ASSESSMENTS_TABLE_NAME: assessmentsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    this.lf4_1 = new Function(this, "LF4_1", {
      functionName: lambdaName2,
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(path.join(__dirname, "lf4_1")),
      handler: "index.handler",
      environment: {
        REQUEST_URL: loadBalancer.loadBalancer.loadBalancerDnsName,
        SQS_QUEUE_URL: sqsQueue.queueUrl,
        ASSESSMENTS_TABLE_NAME: assessmentsTable.tableName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    const lf4_2 = new Function(this, "LF4_2", {
      functionName: lambdaName3,
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(path.join(__dirname, "lf4_2")),
      handler: "index.handler",
      environment: {
        REQUEST_URL: loadBalancer.loadBalancer.loadBalancerDnsName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    // Add queue as event source for lf4_2
    lf4_2.addEventSource(new SqsEventSource(sqsQueue));

    // Add permissions
    metricsTable.grantReadData(this.lf4_0);
    assessmentsTable.grantReadData(this.lf4_0);
    assessmentsTable.grantReadData(this.lf4_1);
    sqsQueue.grantSendMessages(this.lf4_1);
    sqsQueue.grantConsumeMessages(lf4_2);
  }
}
