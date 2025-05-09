import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { QueueStack } from "./queue-stack/queue-stack";
import { CodeExecStack } from "./code-exec-stack/code-exec-stack";
import { ResultManagerStack } from "./result-manager-stack/result-manager-stack";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Function } from "aws-cdk-lib/aws-lambda";

interface ExecutorStackProps extends cdk.StackProps {
  userTable: TableV2;
  questionBankTable: TableV2;
  assessmentsTable: TableV2;
  assessmentQuestionLocatorTable: TableV2;
}

export class ExecutorStack extends cdk.Stack {
  public readonly executorEntryLambda: Function;
  public readonly executorEndLambda: Function;

  constructor(scope: Construct, id: string, props: ExecutorStackProps) {
    super(scope, id, props);

    const resultManagerStack = new ResultManagerStack(
      this,
      "ExecutorResultManagerStack",
      {
        userTable: props.userTable,
        assessmentsTable: props.assessmentsTable,
      }
    );

    const codeExecStack = new CodeExecStack(this, "ExecutorCodeExecStack", {
      resultManagerLambda: resultManagerStack.resultManagerLambda,
      questionBankTable: props.questionBankTable,
    });

    const queueStack = new QueueStack(this, "ExecutorQueueStack", {
      languages: codeExecStack.languages,
      fargateService: codeExecStack.fargateService,
    });

    this.executorEntryLambda = queueStack.producerLambda;
    this.executorEndLambda = resultManagerStack.resultManagerLambda;
  }
}
