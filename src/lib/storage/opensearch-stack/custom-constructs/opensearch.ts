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
import { v4 as uuidv4 } from 'uuid';

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

   // Generate a UUID for truly unique names

// Generate a shorter unique suffix
// Generate a unique suffix
const suffix = Math.random().toString(36).substring(2, 10);

// Create a new collection with unique name
this.collectionName = `questions-${suffix}`;


// Create encryption policy
const encryptionPolicy = new CfnSecurityPolicy(this, "EncryptionPolicy", {
  name: `enc-${suffix}`,
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

// Create network policy
const networkPolicy = new CfnSecurityPolicy(this, "NetworkPolicy", {
  name: `net-${suffix}`,
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



// Set up dependencies
collection.addDependency(encryptionPolicy);
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
  name: `access-${suffix}`,
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
collection.addDependency(accessPolicy);
    this.domainEndpoint = collection.attrCollectionEndpoint;
  }
}
