import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { StorageStack } from "./storage/storage-stack";
import { ExecutorStack } from "./executor/executor-stack";
import { ApiGatewayStack } from "./api/api-gateway-stack";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";

export class CodeSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const storage = new StorageStack(this, "StorageStack");
    // const executor = new ExecutorStack(this, "ExecutorStack", {
    //   userTable: storage.userTable,
    //   questionBankTable: storage.questionBankTable,
    //   assessmentsTable: storage.assessmentsTable,
    //   assessmentQuestionLocatorTable: storage.assessmentQuestionLocatorTable,
    // });

    const lf1 = new Function(this, "test", {
      runtime: Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: Code.fromInline(`
        exports.handler = async function(event) {
          console.log("Received event:", JSON.stringify(event, null, 2));
          return { statusCode: 200, body: "Event received" };
        };
      `),
    });

    const api = new ApiGatewayStack(this, "ApiGatewayStack", {
      codeExecutionLambda: lf1,
    });
  }
}
