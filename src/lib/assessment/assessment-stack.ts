import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EcsFargateConstruct } from './custom-constructs/ecs_fargate';
import { LambdaForEcsFargate } from './custom-constructs/lambda';
import { BedrockConstruct } from './custom-constructs/bedrock';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

export interface AssessmentStackProps extends cdk.StackProps {
  /** Optional Bedrock model IDs to grant permissions for */
  readonly bedrockModelIds?: string[];
}

export class AssessmentStack extends cdk.Stack {
  public readonly ecsFargate: EcsFargateConstruct;
  public readonly lambdaForEcs: LambdaForEcsFargate;
  public readonly bedrock: BedrockConstruct;

  constructor(scope: Construct, id: string, props?: AssessmentStackProps) {
    super(scope, id, props);

    // ECS/Fargate service
    this.ecsFargate = new EcsFargateConstruct(this, 'EcsFargate');

    // Lambda that triggers ECS tasks
    this.lambdaForEcs = new LambdaForEcsFargate(this, 'LambdaForEcsFargate', {
      cluster:        this.ecsFargate.cluster,
      taskDefinition: this.ecsFargate.service.taskDefinition,
      albDns:         this.ecsFargate.service.loadBalancer.loadBalancerDnsName,
    });

    // Bedrock integration (shared VPC)
    const models = ['amazon.titan-tg1-large'];

    this.bedrock = new BedrockConstruct(this, 'Bedrock', {
      vpc:      this.ecsFargate.cluster.vpc,
      modelIds: models,
    });

    // Grant ECS Task Role Bedrock invocation permissions
    // Pull out the Task Role from the service’s TaskDefinition
    const ecsTaskRole = this.ecsFargate.service.taskDefinition.taskRole;

    // Build a least-privilege statement for invoke/list/get
    const bedrockPolicy = new PolicyStatement({
      effect:    Effect.ALLOW,
      actions:   ['bedrock:InvokeModel', 'bedrock:ListModels', 'bedrock:GetModel'],
      resources: models.map(m => `arn:aws:bedrock:${this.region}:${this.account}:foundation-model/${m}`),
    });

    // Attach it
    ecsTaskRole.addToPrincipalPolicy(bedrockPolicy);

    // Output the Task Role ARN so you can inspect it in the console
    new cdk.CfnOutput(this, 'EcsTaskRoleArn', {
      value:       ecsTaskRole.roleArn,
      description: 'IAM Role that your Fargate tasks assume',
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value:       this.ecsFargate.service.loadBalancer.loadBalancerDnsName,
      description: 'Public DNS name of the Fargate service ALB',
    });

    new cdk.CfnOutput(this, 'LambdaInvokeArn', {
      value:       this.lambdaForEcs.fn.functionArn,
      description: 'Invoke ARN for the ECS-triggering Lambda',
    });
  }
}
