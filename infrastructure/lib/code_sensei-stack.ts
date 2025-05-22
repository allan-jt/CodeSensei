import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StorageStack } from "./storage/storage-stack";
import { AssessmentStack } from "./assessment/assessment-stack";
import { MetricsStack } from "./metrics/metrics-stack";
import { ExecutorStack } from "./executor/executor-stack";
import { ApiGatewayStack } from "./api/api-gateway-stack";
import { AuthStack } from "./auth/auth-stack";
import { Cluster } from "aws-cdk-lib/aws-ecs";

export class CodeSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const appName = "CodeSensei";

    const storage = new StorageStack(this, "StorageStack");

    const ECSCluster = new Cluster(this, "CodeSenseiECSCluster");

    const auth = new AuthStack(this, "AuthStack", {
      userTable: storage.userTable,
    });

    const assessment = new AssessmentStack(this, "AssessmentStack", {
      env: props?.env,
      opensearchLamba: storage.opensearchLambda,
      cluster: ECSCluster,
    });

    const executor = new ExecutorStack(this, "ExecutorStack", {
      userTable: storage.userTable,
      questionBankTable: storage.questionBankTable,
      assessmentsTable: storage.assessmentsTable,
      assessmentQuestionLocatorTable: storage.assessmentQuestionLocatorTable,
      cluster: ECSCluster,
    });

    const metrics = new MetricsStack(this, "MetricsStack", {
      appName: appName,
      stackName: `${appName}MetricsStack`,
      metricsTable: storage.metricsTable,
      assessmentsTable: storage.assessmentsTable,
      cluster: ECSCluster,
    });

    const chatbot = new InterviewAiCombinedStack(this, "AIChatBot", {
      cluster: ECSCluster,
    });

    const api = new ApiGatewayStack(this, "APIGatewayStack", {
      executionEntryLambda: executor.executorEntryLambda,
      chatbotEntryLambda: chatbot.chatbotEntryLambda,
      metricsDashboardLambda: metrics.metricsDashboardLambda,
      metricsQuestionLambda: metrics.metricsQuestionLambda,
      assessmentEntryLambda: assessment.lambdaForEcs.fn,
    });
  }
}
