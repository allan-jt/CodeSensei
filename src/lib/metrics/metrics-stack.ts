import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { MetricsLambdaStack } from "./lambda/lambda-stack";
import { MetricsEcsStack } from "./ecs/ecs-stack";
import { MetricsSqsStack } from "./sqs/sqs-stack";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Function } from "aws-cdk-lib/aws-lambda";

interface MetricsStackProps extends cdk.StackProps {
  appName: string;
  metricsTable: TableV2;
  assessmentsTable: TableV2;
}

export class MetricsStack extends cdk.Stack {
  public readonly metricsDashboardLambda: Function;
  public readonly metricsQuestionLambda: Function;

  constructor(scope: Construct, id: string, props: MetricsStackProps) {
    super(scope, id, props);

    const { appName, metricsTable, assessmentsTable } = props;

    const ecsStack = new MetricsEcsStack(this, "MetricsEcsStack", {
      stackName: `${appName}MetricsEcsStack`,
      clusterName: `${appName}MetricsCluster`,
      taskDefinitionName: `${appName}MetricsTaskDefinition`,
      containerName: `${appName}MetricsTaskDefinitionContainer`,
      streamPrefix: `${appName}Metrics`,
      loadBalancerName: `${appName}MetricsLoadBalancer`,
      metricsTable: metricsTable,
      assessmentsTable: assessmentsTable,
    });

    const sqsStack = new MetricsSqsStack(this, "MetricsSqsStack", {
      stackName: `${appName}MetricsSqsStack`,
      queueName: `${appName}MetricsQueue`,
    });

    const lambdaStack = new MetricsLambdaStack(this, "MetricsLambdaStack", {
      stackName: `${appName}MetricsLambdaStack`,
      lambdaName1: `${appName}LF4_0`,
      lambdaName2: `${appName}LF4_1`,
      lambdaName3: `${appName}LF4_2`,
      loadBalancer: ecsStack.loadBalancer,
      sqsQueue: sqsStack.queue,
      metricsTable: metricsTable,
      assessmentsTable: assessmentsTable,
    });

    this.metricsDashboardLambda = lambdaStack.lf4_0;
    this.metricsQuestionLambda = lambdaStack.lf4_1;
  }
}
