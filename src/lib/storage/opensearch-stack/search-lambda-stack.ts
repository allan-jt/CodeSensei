import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface LambdaStackProps extends cdk.StackProps {
  endpoint: string;
  collectionName: string;
  role: cdk.aws_iam.Role;
  region: string;
}

export class LambdaForOpenSearchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const fn = new PythonFunction(this, id, {
      entry: __dirname + "/lambda-code",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_13,
      handler: "handler",
      index: "index.py",
      environment: {
        OPENSEARCH_COLLECTION: props.collectionName,
        OPENSEARCH_ENDPOINT: props.endpoint,
        AWSREGION: props.region,
      },
      role: props.role,
    });
  }
}
