import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { DynamoStack } from "./dynamo-stack/dynamo-stack";
import { Construct } from "constructs";
import { OpenSearchStack } from "./opensearch-stack/opensearch-stack";
import { Function } from "aws-cdk-lib/aws-lambda";

export class StorageStack extends cdk.Stack {
  public readonly userTable: TableV2;
  public readonly questionBankTable: TableV2;
  public readonly assessmentsTable: TableV2;
  public readonly assessmentQuestionLocatorTable: TableV2;
  public readonly metricsTable: TableV2;
  public readonly opensearchLambda: Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamo = new DynamoStack(this, "DynamoStack");
    this.userTable = dynamo.userTable;
    this.questionBankTable = dynamo.questionBankTable;
    this.assessmentsTable = dynamo.assessmentsTable;
    this.assessmentQuestionLocatorTable = dynamo.assessmentQuestionLocatorTable;
    this.metricsTable = dynamo.metricsTable;

    // Comment out if you don't want to create OpenSearch

    const openSearchStack = new OpenSearchStack(this, 'OpenSearchStack', {
      dynamoTable: this.questionBankTable,
    });
    this.opensearchLambda = openSearchStack.opensearchLamba;
    
    // Export the opensearchLambda ARN for downstream consumption
    new cdk.CfnOutput(this, 'OpenSearchLambdaArn', {
      value:       this.opensearchLambda.functionArn,
      description: 'ARN of the OpenSearch init/query Lambda',
    });
  }
}
