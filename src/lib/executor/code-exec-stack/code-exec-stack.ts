import * as cdk from "aws-cdk-lib";
import {
  Cluster,
  ContainerImage,
  FargateTaskDefinition,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Construct } from "constructs";

export class CodeExecStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cluster = new Cluster(this, "ECSCluster");

    const taskDefinition = new FargateTaskDefinition(
      this,
      "ECSFargateTaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
      }
    );

    taskDefinition.addContainer("ECSFargateContainer", {
      image: ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      logging: LogDrivers.awsLogs({ streamPrefix: "ecs" }),
      portMappings: [{ containerPort: 80 }],
    });

    const newFargateService = new ApplicationLoadBalancedFargateService(
      this,
      "ECSFargateServiceWithALB",
      {
        cluster: cluster,
        taskDefinition: taskDefinition,
        publicLoadBalancer: true,
        loadBalancerName: "ECSExecutorALB",
        desiredCount: 1,
      }
    );
  }
}
