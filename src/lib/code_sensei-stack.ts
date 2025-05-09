import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StorageStack } from "./storage/storage-stack";
import { ExecutorStack } from "./executor/executor-stack";
import { ApiGatewayStack } from "./api/api-gateway-stack";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { AuthStack } from "./auth/auth-stack";
import { InterviewAiCombinedStack } from "./chatbot/ai-interviewer-cdk-stack";

export class CodeSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const storage = new StorageStack(this, "StorageStack");
    // const executor = new ExecutorStack(this, "ExecutorStack", {
    //   userTable: storage.userTable,
    //   questionBankTable: storage.questionBankTable,
    //   assessmentsTable: storage.assessmentsTable,
    //   assessmentQuestionLocatorTable: storage.assessmentQuestionLocatorTable,
    // });
    // const auth = new AuthStack(this, "AuthStack", {
    //   userTable: storage.userTable,
    // });
    // const api = new ApiGatewayStack(this, "APIGatewayStack", {
    //   executionEntryLambda: executor.executorEntryLambda,
    // });
    // const ai_interviewer = new InterviewAiCombinedStack(this, "AIChatBot");
  }
}
