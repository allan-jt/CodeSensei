import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { QuestionsOpenSearchStack } from "./questions-opensearch-stack";
import { LambdaForOpenSearchStack } from "./search-lambda-stack";

export class OpenSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const opensearch = new QuestionsOpenSearchStack(
      this,
      "QuestionsOpenSearchStack"
    );

    const lambdaOS = new LambdaForOpenSearchStack(
      this,
      "LambdaForOpenSearchStack",
      {
        endpoint: opensearch.domainEndpoint,
        collectionName: opensearch.collectionName,
        role: opensearch.lambdaRole,
        region: this.region,
      }
    );

    lambdaOS.addDependency(opensearch);
  }
}
