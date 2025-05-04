import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { DynamoStack } from "./dynamo-stack/dynamo-stack";
import { Construct } from "constructs";
import { OpenSearchStack } from "./opensearch-stack/opensearch-stack";
import { Function } from "aws-cdk-lib/aws-lambda";
import { FrontendBucket } from "./frontend-storage/frontend-bucket";
import { Bucket } from "aws-cdk-lib/aws-s3";

export class StorageStack extends cdk.Stack {
  public readonly userTable: TableV2;
  public readonly questionBankTable: TableV2;
  public readonly assessmentsTable: TableV2;
  public readonly assessmentQuestionLocatorTable: TableV2;
  public readonly metricsTable: TableV2;
  public readonly opensearchLamba?: Function;
  public readonly frontendBucket: Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamo = new DynamoStack(this, "DynamoStack");
    this.userTable = dynamo.userTable;
    this.questionBankTable = dynamo.questionBankTable;
    this.assessmentsTable = dynamo.assessmentsTable;
    this.assessmentQuestionLocatorTable = dynamo.assessmentQuestionLocatorTable;
    this.metricsTable = dynamo.metricsTable;

    const frontend = new FrontendBucket(this, "FrontendStorage");
    this.frontendBucket = frontend.bucket;  

    // Comment out if you don't want to create OpenSearch
    // this.opensearchLamba = new OpenSearchStack(this, "OpenSearchStack", {
    //   dynamoTable: this.questionBankTable,
    // }).opensearchLamba;
  }
}
