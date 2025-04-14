import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as dotenv from "dotenv";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Domain } from "aws-cdk-lib/aws-opensearchservice";

dotenv.config(); // Load .env

interface OpenSearchLambdaStackProps extends StackProps {
  domainName: string;
}

export class OpenSearchLambdaStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: OpenSearchLambdaStackProps
  ) {
    super(scope, id, props);

    // OpenSearch domain
    const domain = new Domain(this, "MyOpenSearchDomain", {
      version: cdk.aws_opensearchservice.EngineVersion.OPENSEARCH_2_11,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      capacity: {
        dataNodeInstanceType: "t3.small.search",
        dataNodes: 1,
        multiAzWithStandbyEnabled: false,
      },
      fineGrainedAccessControl: {
        masterUserName: "admin",
        masterUserPassword: cdk.SecretValue.unsafePlainText("Password100!"),
      },
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
    });

    // Lambda function
    const lambdaFn = new NodejsFunction(this, "MyLambda", {
      entry: path.join(__dirname, "/lambda-ts/index.ts"),
      handler: "handler",
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      environment: {
        OPENSEARCH_USERNAME: "admin",
        OPENSEARCH_PASSWORD: "Password100!",
        OPENSEARCH_ENDPOINT: domain.domainEndpoint,
      },
    });

    domain.grantReadWrite(lambdaFn); // Give access to OpenSearch
  }
}
