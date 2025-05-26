import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import { Queue } from "aws-cdk-lib/aws-sqs";

interface LambdaProps {
  sqs: Queue;
}

export class LambdaCustom extends Construct {
  public readonly lambda: Function;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    this.lambda = new Function(this, "ChatBotLambda", {
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(join(__dirname, "../lambda-code")),
      handler: "index.handler",
      environment: {
        SQS_URL: props.sqs.queueUrl
      },
      timeout: cdk.Duration.seconds(10),
      functionName: "ChatBotLambda",
    });

    props.sqs.grantSendMessages(this.lambda)
  }
}
