import { Construct } from 'constructs';
import {
  Bucket,
  BucketAccessControl,
  BlockPublicAccess
} from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';

export class FrontendBucket extends Construct {
  public readonly bucket: Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new Bucket(this, 'FrontendWebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,  // Block just ACLs but not policies
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });;
  }
}