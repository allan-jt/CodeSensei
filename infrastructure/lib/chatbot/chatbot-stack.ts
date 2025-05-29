import * as cdk from "aws-cdk-lib";
import { Function } from "aws-cdk-lib/aws-lambda";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { BedrockAccessRole } from "./custom-constructs/bedrock";
import { ECSCustom } from "./custom-constructs/ecs";
import { LambdaCustom } from "./custom-constructs/lambda";
import { Queue } from "aws-cdk-lib/aws-sqs";

interface ChatbotStackProps extends cdk.StackProps {
  readonly questionBankTable: TableV2;
  readonly cluster: Cluster;
}

export class ChatbotStack extends cdk.Stack {
  public readonly entryLambda: Function;

  constructor(scope: Construct, id: string, props: ChatbotStackProps) {
    super(scope, id, props);

    const bedrockRole = new BedrockAccessRole(this, "BedrockAccessRole");

    const sqs = new Queue(this, "ChatbotSQSQueue");

    const ecs = new ECSCustom(this, "ChatbotECSService", {
      questionBankTable: props.questionBankTable,
      cluster: props.cluster,
      modelId: bedrockRole.modelId.modelId,
      bedrockRole: bedrockRole.role,
      sqs: sqs
    });

    this.entryLambda = new LambdaCustom(this, "ChatbotLambda", {
      sqs: sqs
    }).lambda;
  }
}
