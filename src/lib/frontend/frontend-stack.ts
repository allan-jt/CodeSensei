import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as path from "path";

interface FrontendStackProps extends StackProps {
  bucket: s3.Bucket;
}

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    new s3deploy.BucketDeployment(this, 'DeployFrontend', {
      sources: [s3deploy.Source.asset(path.resolve(__dirname, "../../../frontend-static"))],
      destinationBucket: props.bucket,
    });
  }
}