import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
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
  readonly questionBankTable: TableV2;
}
export class CodeExecStack extends cdk.Stack {
  public readonly cluster: Cluster;
  public readonly taskDefinition: FargateTaskDefinition[] = [];
  public readonly fargateService: ApplicationLoadBalancedFargateService[] = [];
  public readonly languages: string[] = ["python", "javascript"];

  constructor(scope: Construct, id: string, props: CodeExecStackProps) {
    super(scope, id, props);

    this.cluster = new Cluster(this, "ExecutorECSCluster");

    for (const language of this.languages) {
      const taskDefinition = new FargateTaskDefinition(
        this,
        `ECSFargateTaskDefinition${language}`,
        {
          cpu: 512,
          memoryLimitMiB: 1024,
        }
      );

      taskDefinition.addContainer(`ECSFargateContainer${language}`, {
        image: ContainerImage.fromAsset(
          join(__dirname, `${language}-executor`)
        ),
        logging: LogDrivers.awsLogs({ streamPrefix: `ecs${language}` }),
        portMappings: [{ containerPort: 80 }],
        environment: {
          LAMBDA_FUNCTION_NAME: props.resultManagerLambda.functionName,
          AWSREGION: this.region,
        },
      });

      props.resultManagerLambda.grantInvoke(taskDefinition.taskRole);
      props.questionBankTable.grantReadData(taskDefinition.taskRole);

      const fargateService = new ApplicationLoadBalancedFargateService(
        this,
        `ECSFargateServiceWithALB${language}`,
        {
          cluster: this.cluster,
          taskDefinition: taskDefinition,
          publicLoadBalancer: true,
          loadBalancerName: `ECSExecutorALB${language}`,
          desiredCount: 1,
        }
      );

      this.taskDefinition.push(taskDefinition);
      this.fargateService.push(fargateService);
    }

    // this.taskDefinition = new FargateTaskDefinition(
    //   this,
    //   "ECSFargateTaskDefinition",
    //   {
    //     cpu: 256,
    //     memoryLimitMiB: 512,
    //   }
    // );

    // this.taskDefinition.addContainer("ECSFargateContainer", {
    //   image: ContainerImage.fromAsset(join(__dirname, "python-executor")),
    //   logging: LogDrivers.awsLogs({ streamPrefix: "ecs" }),
    //   portMappings: [{ containerPort: 80 }],
    //   environment: {
    //     LAMBDA_FUNCTION_NAME: props.resultManagerLambda.functionName,
    //     AWSREGION: this.region,
    //   },
    // });

    // props.resultManagerLambda.grantInvoke(this.taskDefinition.taskRole);
    // props.questionBankTable.grantReadData(this.taskDefinition.taskRole);

    // this.fargateService = new ApplicationLoadBalancedFargateService(
    //   this,
    //   "ECSFargateServiceWithALB",
    //   {
    //     cluster: this.cluster,
    //     taskDefinition: this.taskDefinition,
    //     publicLoadBalancer: true,
    //     loadBalancerName: "ECSExecutorALB",
    //     desiredCount: 1,
    //   }
    // );
  }
}
