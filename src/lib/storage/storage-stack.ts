import * as cdk from "aws-cdk-lib";
import { DynamoStack } from "./dynamo-stack/dynamo-stack";
import { Construct } from "constructs";
import { OpenSearchStack } from "./opensearch-stack/opensearch-stack";
import { OpenSearchLambdaStack } from "./opensearch-stack/opensearch";

export class StorageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DynamoStack(this, "DynamoStack");
    new OpenSearchStack(this, "OpenSearchStack");
    // new OpenSearchLambdaStack(this, "OpenSearchLambdaStack");
  }
}
