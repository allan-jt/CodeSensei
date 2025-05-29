import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  LogDrivers,
} from "aws-cdk-lib/aws-ecs";
import { Role, PolicyStatement } from "aws-cdk-lib/aws-iam";
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
    taskDefinition.taskRole.addToPrincipalPolicy(
      new PolicyStatement({
        actions: ["execute-api:ManageConnections"],
        resources: ["arn:aws:execute-api:*:*:*/*/POST/@connections/*"],
      })
    );
    

    const fargateService = new FargateService(
      this,
      "ECSFargateServiceChatbot",
      {
        cluster: props.cluster,
        taskDefinition: taskDefinition,
        desiredCount: 1,
      }
    );

    fargateService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 6,
    });
  }
}
