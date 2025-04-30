import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { QueueStack } from "./queue-stack/queue-stack";
import { CodeExecStack } from "./code-exec-stack/code-exec-stack";
import { ResultManagerStack } from "./result-manager-stack/result-manager-stack";

export class ExecutorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const resultManagerStack = new ResultManagerStack(
      this,
      "ExecutorResultManagerStack"
    );

    const codeExecStack = new CodeExecStack(this, "ExecutorCodeExecStack", {
      resultManagerLambda: resultManagerStack.resultManagerLambda,
    });
    const queueStack = new QueueStack(this, "ExecutorQueueStack", {
      fargateService: codeExecStack.fargateService,
    });
  }
}
