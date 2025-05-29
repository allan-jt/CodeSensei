import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Cluster } from "aws-cdk-lib/aws-ecs";

export class ECSStack extends cdk.Stack {
  public readonly cluster: Cluster;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.cluster = new Cluster(this, "CodeSenseiECSCluster");
  }
}
