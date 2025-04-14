import * as cdk from "aws-cdk-lib";
import { DynamoStack } from "./dynamo-stack/dynamo-stack";
import { Construct } from "constructs";
import { OpenSearchStack } from "./opensearch-stack/opensearch-stack";

export class StorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dynamo = new DynamoStack(this, "DynamoStack");

    // Comment out if you don't want to create OpenSearch
    new OpenSearchStack(this, "OpenSearchStack", {
      dynamoTable: dynamo.questionBankTable,
    });
  }
}
