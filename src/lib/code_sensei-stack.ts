import * as cdk from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export class CodeSenseiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "CodeSenseiBucket", {
      bucketName: "codesensei-bucket",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
