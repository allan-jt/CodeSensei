import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface LambdaStackProps extends cdk.StackProps {
  endpoint: string;
  collectionName: string;
  role: cdk.aws_iam.Role;
}

export class LambdaForOpenSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const fn = new cdk.aws_lambda.Function(this, id, {
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_13,
      handler: "index.handler",
      code: cdk.aws_lambda.Code.fromAsset(__dirname + "/lambda-code"),
      environment: {
        OPENSEARCH_COLLECTION: props.collectionName,
        OPENSEARCH_ENDPOINT: props.endpoint,
      },
      role: props.role,
    });
  }
}
