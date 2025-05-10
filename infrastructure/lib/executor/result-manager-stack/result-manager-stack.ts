import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { join } from "path";

interface ResultManagerStackProps extends cdk.StackProps {
  readonly userTable: TableV2;
  readonly assessmentsTable: TableV2;
}
export class ResultManagerStack extends cdk.Stack {
  public readonly resultManagerLambda: Function;
  constructor(scope: Construct, id: string, props: ResultManagerStackProps) {
    super(scope, id, props);

    this.resultManagerLambda = new Function(
      this,
      "ExecutorResultManagerLambda",
      {
        functionName: "ExecutorResultManagerLambda",
        runtime: Runtime.PYTHON_3_13,
        code: Code.fromAsset(join(__dirname, "lambda-code")),
        handler: "index.handler",
        timeout: cdk.Duration.seconds(30),
        environment: {
          USER_TABLE_NAME: props.userTable.tableName,
          ASSESSMENTS_TABLE_NAME: props.assessmentsTable.tableName,
        },
      }
    );

    this.resultManagerLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["execute-api:ManageConnections"],
        resources: ["arn:aws:execute-api:*:*:*/*/POST/@connections/*"],
      })
    );

    props.userTable.grantReadData(this.resultManagerLambda);
    props.assessmentsTable.grantReadWriteData(this.resultManagerLambda);
  }
}
