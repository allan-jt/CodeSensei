import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class OpenSearchCustom extends cdk.Stack {
  public readonly domainEndpoint: string;
  public readonly collectionName: string = "questions";
  public readonly lambdaRole: cdk.aws_iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const collection = new cdk.aws_opensearchserverless.CfnCollection(
      this,
      "QuestionsCollection",
      {
        name: this.collectionName,
        type: "SEARCH",
      }
    );

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
    collection.addDependency(encryptionPolicy);

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
    collection.addDependency(networkPolicy);

    this.lambdaRole = new cdk.aws_iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    this.lambdaRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: [
          "aoss:DescribeCollectionItems",
          "aoss:UpdateCollectionItems",
          "aoss:CreateCollectionItems",
          "aoss:ReadDocument",
          "aoss:WriteDocument",
          "aoss:DescribeIndex",
        ],
        resources: [
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:collection/${collection.attrId}`,
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:index/${this.collectionName}/*`,
        ],
      })
    );

    this.lambdaRole.addToPolicy(
      new cdk.aws_iam.PolicyStatement({
        effect: cdk.aws_iam.Effect.ALLOW,
        actions: ["aoss:APIAccessAll"],
        resources: [
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:collection/${collection.attrId}`,
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:index/${this.collectionName}/*`,
        ],
      })
    );

    this.lambdaRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const accessPolicy = new cdk.aws_opensearchserverless.CfnAccessPolicy(
      this,
      "AccessPolicy",
      {
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
                  "aoss:CreateCollectionItems",
                ],
              },
              {
                ResourceType: "index",
                Resource: [`index/${this.collectionName}/*`],
                Permission: [
                  "aoss:CreateIndex",
                  "aoss:UpdateIndex",
                  "aoss:DeleteIndex",
                  "aoss:ReadDocument",
                  "aoss:WriteDocument",
                  "aoss:DescribeIndex",
                ],
              },
            ],
            Principal: [this.lambdaRole.roleArn],
          },
        ]),
      }
    );

    this.domainEndpoint = collection.attrCollectionEndpoint;
  }
}
