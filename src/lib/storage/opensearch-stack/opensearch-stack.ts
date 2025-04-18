import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { OpenSearchCustom } from "./custom-constructs/opensearch";
import { LambdaCustom } from "./custom-constructs/lambda";
import { Function } from "aws-cdk-lib/aws-lambda";

interface OpenSearchStackProps extends cdk.StackProps {
  dynamoTable: TableV2;
}

export class OpenSearchStack extends cdk.Stack {
  public readonly opensearchLamba: Function;
  constructor(scope: Construct, id: string, props: OpenSearchStackProps) {
    super(scope, id, props);

    const opensearch = new OpenSearchCustom(this, "OpenSearchCustom");

    this.opensearchLamba = new LambdaCustom(this, "LambdaForOpenSearchCustom", {
      endpoint: opensearch.domainEndpoint,
      collectionName: opensearch.collectionName,
      role: opensearch.lambdaRole,
      region: this.region,
      dynamoTable: props.dynamoTable,
    }).fn;
  }
}
