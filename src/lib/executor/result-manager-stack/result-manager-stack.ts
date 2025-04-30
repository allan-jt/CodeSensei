import * as cdk from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";

export class ResultManagerStack extends cdk.Stack {
  public readonly resultManagerLambda: Function;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.resultManagerLambda = new Function(
      this,
      "ExecutorResultManagerLambda",
      {
        functionName: "ExecutorResultManagerLambda",
        runtime: Runtime.PYTHON_3_13,
        code: Code.fromAsset(join(__dirname, "lambda-code")),
        handler: "index.handler",
        timeout: cdk.Duration.seconds(30),
      }
    );
  }
}
