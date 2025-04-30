import * as cdk from "aws-cdk-lib";
import {
  Cluster,
  ContainerImage,
  FargateTaskDefinition,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";

interface CodeExecStackProps extends cdk.StackProps {
  readonly resultManagerLambda: Function;
}
export class CodeExecStack extends cdk.Stack {
  public readonly cluster: Cluster;
  public readonly taskDefinition: FargateTaskDefinition;
  public readonly fargateService: ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: CodeExecStackProps) {
    super(scope, id, props);

    this.cluster = new Cluster(this, "ECSCluster");

    this.taskDefinition = new FargateTaskDefinition(
      this,
      "ECSFargateTaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
      }
    );

    this.taskDefinition.addContainer("ECSFargateContainer", {
      image: ContainerImage.fromAsset(join(__dirname, "python-executor")),
      logging: LogDrivers.awsLogs({ streamPrefix: "ecs" }),
      portMappings: [{ containerPort: 80 }],
      environment: {
        LAMBDA_FUNCTION_NAME: props.resultManagerLambda.functionName,
        AWSREGION: this.region,
      },
    });

    props.resultManagerLambda.grantInvoke(this.taskDefinition.taskRole);

    this.fargateService = new ApplicationLoadBalancedFargateService(
      this,
      "ECSFargateServiceWithALB",
      {
        cluster: this.cluster,
        taskDefinition: this.taskDefinition,
        publicLoadBalancer: true,
        loadBalancerName: "ECSExecutorALB",
        desiredCount: 1,
      }
    );
  }
}
