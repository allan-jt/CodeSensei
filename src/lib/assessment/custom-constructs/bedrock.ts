import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import {
  Role,
  ServicePrincipal,
  PolicyStatement,
  ManagedPolicy,
} from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface BedrockConstructProps {
  /** Optional VPC to host Bedrock calls (and to attach an endpoint) */
  readonly vpc?: ec2.IVpc;
  /** List of Bedrock model ARNs or IDs you’ll invoke */
  readonly modelIds: string[];
}

export class BedrockConstruct extends Construct {
  public readonly bedrockRole: Role;

  constructor(scope: Construct, id: string, props: BedrockConstructProps) {
    super(scope, id);

    // 1) IAM role for Bedrock invocation
    this.bedrockRole = new Role(this, 'BedrockInvokeRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    this.bedrockRole.addToPolicy(new PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:ListModels', 'bedrock:GetModel'],
      resources: props.modelIds.map(id => 
        `arn:aws:bedrock:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:model/${id}`
      ),
    }));

    // 2) If you provided a VPC, optionally spin up a private interface endpoint 
    //    so your calls to the Bedrock API never need to go over the public internet.
    if (props.vpc) {
      props.vpc.addInterfaceEndpoint('BedrockEndpoint', {
        service: new ec2.InterfaceVpcEndpointService(
          `com.amazonaws.${cdk.Aws.REGION}.bedrock-runtime`,
          443
        ),
        privateDnsEnabled: true,
      });
    }
  }
}