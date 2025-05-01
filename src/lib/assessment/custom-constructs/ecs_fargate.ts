import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cdk from 'aws-cdk-lib';

export interface EcsFargateProps {
  /** Optionally provide an existing VPC */
  readonly vpc?: ec2.IVpc;
  /** Container image URI (defaults to ECS sample image) */
  readonly containerImage?: string;
  /** Number of tasks to run (default: 1) */
  readonly desiredCount?: number;
  /** CPU units for each task (default: 256) */
  readonly cpu?: number;
  /** Memory (MiB) for each task (default: 512) */
  readonly memoryLimitMiB?: number;
}

export class EcsFargateConstruct extends Construct {
  /** ECS cluster created or provided */
  public readonly cluster: ecs.Cluster;
  /** Fargate service behind an ALB */
  public readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props?: EcsFargateProps) {
    super(scope, id);

    // Use provided VPC or create a new one
    const vpc = props?.vpc ?? new ec2.Vpc(this, 'Vpc', { maxAzs: 2 });

    // Create ECS cluster in the VPC
    this.cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Define Fargate service + ALB
    this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster: this.cluster,
      serviceName: 'Code_Sensei_ECS_1-0',
      cpu: props?.cpu ?? 256,
      memoryLimitMiB: props?.memoryLimitMiB ?? 512,
      desiredCount: props?.desiredCount ?? 1,
      publicLoadBalancer: true,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry(props?.containerImage ?? 'aaronbengo/ai_webserver:latest'),
        containerPort: 80,
      },
    });

    // Output ALB DNS for convenience
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.service.loadBalancer.loadBalancerDnsName,
      description: 'Public DNS for the ECS Fargate service',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.service.serviceName,  // outputs the actual service name
      description: 'The name of the ECS service',
    });
  }
}
