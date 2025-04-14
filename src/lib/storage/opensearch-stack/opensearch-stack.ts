import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { QuestionsOpenSearchStack } from "./questions-opensearch-stack";
import { QuestionsLambdaStack } from "./questions-lambda-stack";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";

interface OpenSearchStackProps extends cdk.StackProps {
  dynamoTable: TableV2;
}
export class OpenSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OpenSearchStackProps) {
    super(scope, id, props);

    const opensearch = new QuestionsOpenSearchStack(
      this,
      "QuestionsOpenSearchStack"
    );

    const lambdaForOS = new QuestionsLambdaStack(
      this,
      "LambdaForOpenSearchStack",
      {
        endpoint: opensearch.domainEndpoint,
        collectionName: opensearch.collectionName,
        role: opensearch.lambdaRole,
        region: this.region,
        dynamoTable: props.dynamoTable,
      }
    );

    lambdaForOS.addDependency(opensearch);
  }
}
