import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import path = require("path");

export interface LambdaProps {
  endpoint: string;
  collectionName: string;
  role: cdk.aws_iam.Role;
  region: string;
  dynamoTable: TableV2;
}

export class LambdaCustom extends Construct {
  public readonly fn: Function;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    this.fn = new cdk.aws_lambda.Function(this, "LambdaForOpenSearchService", {
      runtime: Runtime.PYTHON_3_13,
      code: Code.fromAsset(path.join(__dirname, "../lambda-code")),
      handler: "index.handler",
      environment: {
        OPENSEARCH_COLLECTION: props.collectionName,
        OPENSEARCH_ENDPOINT: props.endpoint,
        AWSREGION: props.region,
        DYNAMO_TABLE_NAME: props.dynamoTable.tableName,
      },
      role: props.role,
      timeout: cdk.Duration.seconds(60),
      functionName: "LambdaForOpenSearchService",
    });

    props.dynamoTable.grantReadWriteData(this.fn);
  }
}
