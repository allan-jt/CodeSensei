import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Vpc, IVpc } from "aws-cdk-lib/aws-ec2";
import { Cluster, FargateTaskDefinition, ContainerImage, LogDriver } from "aws-cdk-lib/aws-ecs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";

interface MetricsEcsStackProps extends cdk.StackProps {
    vpc?: IVpc;
}

export class MetricsEcsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: MetricsEcsStackProps) {
        super(scope, id, props);

        const appName = "CodeSensei";

        // Use provided VPC or create a new one
        const vpc = props?.vpc || new Vpc(this, "MetricsVpc", { maxAzs: 2 });

        // Create an ECS cluster
        const cluster = new Cluster(this, "MetricsCluster", {
            clusterName: `${appName}MetricsCluster`,
            vpc
        });

        // Create a Fargate task definition
        const taskDefinition = new FargateTaskDefinition(this, "MetricsTaskDef", {
            cpu: 256,
            memoryLimitMiB: 512
        });

        // Add a container to the task definition
        taskDefinition.addContainer("MetricsContainer", {
            image: ContainerImage.fromAsset(path.join(__dirname, "task"), { platform: Platform.LINUX_AMD64}),
            logging: LogDriver.awsLogs({ streamPrefix: `${appName}-Metrics` })
        });
    }
}