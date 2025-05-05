import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { writeFileSync } from "fs";
import * as dotenv from "dotenv";
import path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "FrontendBucket", {
      bucketName: "react-frontend-bucket-codesensei",
      versioned: false,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html",
    });

    const reactDist = path.join(__dirname, "react-app/dist");
    const envFilePath = path.join(reactDist, "env.js");
    const envContent = `window.env = {
      SOCKET_API_URL: "${process.env.SOCKET_API_URL}",
    };`;
    writeFileSync(envFilePath, envContent);

    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(reactDist)],
      destinationBucket: bucket,
    });
  }
}