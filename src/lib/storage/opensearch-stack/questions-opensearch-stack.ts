import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class QuestionsOpenSearchStack extends cdk.Stack {
  public readonly domainEndpoint: string;
  public readonly collectionName: string = "questions";
  public readonly lambdaRole: cdk.aws_iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const encryptionPolicy = new cdk.aws_opensearchserverless.CfnSecurityPolicy(
      this,
      "EncryptionPolicy",
      {
        name: "encryption-policy",
        type: "encryption",
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${this.collectionName}`],
            },
          ],
          AWSOwnedKey: true,
        }),
      }
    );

    const networkPolicy = new cdk.aws_opensearchserverless.CfnSecurityPolicy(
      this,
      "NetworkPolicy",
      {
        name: "public-access",
        type: "network",
        policy: JSON.stringify([
          {
            Rules: [
              {
                ResourceType: "collection",
                Resource: [`collection/${this.collectionName}`],
              },
            ],
            AllowFromPublic: true,
          },
        ]),
      }
    );

    const collection = new cdk.aws_opensearchserverless.CfnCollection(
      this,
      "QuestionsCollection",
      {
        name: this.collectionName,
        type: "SEARCH",
      }
    );

    collection.addDependency(encryptionPolicy);
    collection.addDependency(networkPolicy);

    this.lambdaRole = new cdk.aws_iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    this.lambdaRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["aoss:DescribeCollectionItems", "aoss:UpdateCollectionItems"],
        resources: [
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:collection/${this.collectionName}`,
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:index/${this.collectionName}/*`,
        ],
      })
    );

    this.lambdaRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    new cdk.aws_opensearchserverless.CfnAccessPolicy(this, "AccessPolicy", {
      name: "lambda-access",
      type: "data",
      policy: JSON.stringify([
        {
          Rules: [
            {
              ResourceType: "collection",
              Resource: [`collection/${this.collectionName}`],
              Permission: [
                "aoss:DescribeCollectionItems",
                "aoss:UpdateCollectionItems",
              ],
            },
            {
              ResourceType: "index",
              Resource: [`index/${this.collectionName}/*`],
              Permission: ["aoss:ReadDocument", "aoss:WriteDocument"],
            },
          ],
          Principal: [this.lambdaRole.roleArn],
        },
      ]),
    });

    this.domainEndpoint = `https://${this.collectionName}.${this.region}.aoss.amazonaws.com`;
  }
}
