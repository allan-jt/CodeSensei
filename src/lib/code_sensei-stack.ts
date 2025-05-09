import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StorageStack } from "./storage/storage-stack";
import { MetricsStack } from "./metrics/metrics-stack";
import { ExecutorStack } from "./executor/executor-stack";
import { ApiGatewayStack } from "./api/api-gateway-stack";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { AuthStack } from "./auth/auth-stack";
import { InterviewAiCombinedStack } from "./chatbot/ai-interviewer-cdk-stack";

export class CodeSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = "CodeSensei";

    const storage = new StorageStack(this, "StorageStack");

    const metrics = new MetricsStack(this, "MetricsStack", {
      appName: appName,
      stackName: `${appName}MetricsStack`,
      metricsTable: storage.metricsTable,
      assessmentsTable: storage.assessmentsTable,
    });

    const executor = new ExecutorStack(this, "ExecutorStack", {
      userTable: storage.userTable,
      questionBankTable: storage.questionBankTable,
      assessmentsTable: storage.assessmentsTable,
      assessmentQuestionLocatorTable: storage.assessmentQuestionLocatorTable,
    });
    const chatbot = new InterviewAiCombinedStack(this, "AIChatBot");

    const auth = new AuthStack(this, "AuthStack", {
      userTable: storage.userTable,
    });
    const api = new ApiGatewayStack(this, "APIGatewayStack", {
      executionEntryLambda: executor.executorEntryLambda,
      chatbotEntryLambda: chatbot.chatbotEntryLambda,
      metricsDashboardLambda: metrics.metricsDashboardLambda,
      metricsQuestionLambda: metrics.metricsQuestionLambda,
    });
  }
}
