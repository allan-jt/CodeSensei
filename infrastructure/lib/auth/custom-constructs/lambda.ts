import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";

interface LambdaProps {
  userTable: TableV2;
}

export class LambdaCustom extends Construct {
  public readonly fn: Function;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    this.fn = new Function(this, "LambdaForCognitoService", {
        runtime: Runtime.PYTHON_3_13,
        code: Code.fromAsset(join(__dirname, "../lambda-code")),
        handler: "index.handler",
        environment: {
          DYNAMO_TABLE_NAME: props.userTable.tableName,
        },
        timeout: cdk.Duration.seconds(30),
        functionName: "LambdaForCognitoService",
    });
    
    props.userTable.grantReadWriteData(this.fn)
  }
}
