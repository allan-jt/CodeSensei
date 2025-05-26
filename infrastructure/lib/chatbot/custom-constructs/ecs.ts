import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import {
  Cluster,
  ContainerImage,
  FargateTaskDefinition,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { Role } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { join } from "path";

interface ECSProps {
  readonly questionBankTable: TableV2;
  readonly cluster: Cluster;
  readonly modelId: string;
  readonly bedrockRole: Role;
  readonly sqs: Queue;
}

export class ECSCustom extends Construct {
  public readonly fargateServiceUrl: string;

  constructor(scope: Construct, id: string, props: ECSProps) {
    super(scope, id);

    const taskDefinition = new FargateTaskDefinition(
      this,
      `ECSFargateTaskDefinitionChatBot`,
      {
        cpu: 512,
        memoryLimitMiB: 1024,
        taskRole: props.bedrockRole,
      }
    );

    taskDefinition.addContainer(`ECSFargateContainerChatbot`, {
      image: ContainerImage.fromAsset(join(__dirname, `../ecs-service`)),
      logging: LogDrivers.awsLogs({
        streamPrefix: `ecsChatbot`,
        logRetention: RetentionDays.ONE_DAY,
      }),
      portMappings: [{ containerPort: 80 }],
      environment: {
        BEDROCK_MODEL: props.modelId,
        QUESTION_DB: props.questionBankTable.tableName,
        SQS_URL: props.sqs.queueUrl,
      },
    });

    props.questionBankTable.grantReadData(taskDefinition.taskRole);
    props.sqs.grantConsumeMessages(taskDefinition.taskRole);

    const fargateService = new ApplicationLoadBalancedFargateService(
      this,
      `ECSFargateServiceWithALBChatbot`,
      {
        cluster: props.cluster,
        taskDefinition: taskDefinition,
        publicLoadBalancer: true,
        loadBalancerName: `ECSExecutorALBChatbot`,
        desiredCount: 1,
      }
    );

    fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 6,
    });

    this.fargateServiceUrl = fargateService.loadBalancer.loadBalancerDnsName;
  }
}
