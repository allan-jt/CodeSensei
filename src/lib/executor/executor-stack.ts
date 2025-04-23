import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { QueueStack } from "./queue-stack/queue-stack";

export class ExecutorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queueStack = new QueueStack(this, "ExecutorQueueStack");
  }
}
