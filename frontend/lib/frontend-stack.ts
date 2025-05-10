import * as cdk from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import { writeFileSync } from "fs";
import * as dotenv from "dotenv";
import path = require("path");
import { Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3StaticWebsiteOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

dotenv.config({ path: path.join(__dirname, "../.env") });

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, "FrontendBucket", {
      bucketName: "react-frontend-bucket-codesensei",
      versioned: false,
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // publicReadAccess: false,
      // blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
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

    const distribution = new Distribution(this, "FrontendDistribution", {
      defaultBehavior: {
        origin: new S3StaticWebsiteOrigin(bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    const reactDist = path.join(__dirname, "react-app/dist");
    const envFilePath = path.join(reactDist, "env.js");
    const envContent = `window.env = {
      CLIENT_ID: "${process.env.CLIENT_ID}",
      AUTHORITY: "${process.env.AUTHORITY}",
      REDIRECT_URL: "https://${distribution.domainName}",
      SOCKET_URL: "${process.env.SOCKET_URL}",
      HTTP_URL: "${process.env.HTTP_URL}",
    };`;
    writeFileSync(envFilePath, envContent);

    new BucketDeployment(this, "DeployWebsite", {
      sources: [Source.asset(reactDist)],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
