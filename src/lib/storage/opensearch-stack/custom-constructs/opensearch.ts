import * as cdk from "aws-cdk-lib";
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import {
  CfnAccessPolicy,
  CfnCollection,
  CfnSecurityPolicy,
} from "aws-cdk-lib/aws-opensearchserverless";
import { Construct } from "constructs";

export class OpenSearchCustom extends Construct {
  public readonly domainEndpoint: string;
  public readonly collectionName: string = "questions";
  public readonly lambdaRole: Role;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const collection = new CfnCollection(this, "QuestionsCollection", {
      name: this.collectionName,
      type: "SEARCH",
    });

    const encryptionPolicy = new CfnSecurityPolicy(this, "EncryptionPolicy", {
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
    });
    collection.addDependency(encryptionPolicy);

    const networkPolicy = new CfnSecurityPolicy(this, "NetworkPolicy", {
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
    });
    collection.addDependency(networkPolicy);

    this.lambdaRole = new Role(this, "LambdaExecutionRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    this.lambdaRole.addToPolicy(
      new PolicyStatement({
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
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["aoss:APIAccessAll"],
        resources: [
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:collection/${collection.attrId}`,
          `arn:aws:aoss:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:index/${this.collectionName}/*`,
        ],
      })
    );

    this.lambdaRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSLambdaBasicExecutionRole"
      )
    );

    const accessPolicy = new CfnAccessPolicy(this, "AccessPolicy", {
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
    });

    this.domainEndpoint = collection.attrCollectionEndpoint;
  }
}
