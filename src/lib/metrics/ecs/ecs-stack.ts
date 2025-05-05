import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Cluster, FargateTaskDefinition, ContainerImage, LogDriver } from "aws-cdk-lib/aws-ecs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { SecurityGroup, Port, Peer } from "aws-cdk-lib/aws-ec2";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

interface MetricsEcsStackProps extends cdk.StackProps {
    clusterName: string;
    taskDefinitionName: string;
    containerName: string;
    streamPrefix: string;
    metricsTable: TableV2
}

export class MetricsEcsStack extends cdk.Stack {
    public readonly cluster: Cluster;
    public readonly taskDefinition: FargateTaskDefinition;
    public readonly securityGroup: SecurityGroup;

    constructor(scope: Construct, id: string, props: MetricsEcsStackProps) {
        super(scope, id, props);

        const { clusterName, taskDefinitionName, containerName, streamPrefix, metricsTable } = props;

        // Create an ECS cluster
        this.cluster = new Cluster(this, "MetricsCluster", {
            clusterName: clusterName
        });

        // Create a Fargate task definition
        this.taskDefinition = new FargateTaskDefinition(this, taskDefinitionName, {
            cpu: 256,
            memoryLimitMiB: 512
        });

        // Add a container to the task definition
        this.taskDefinition.addContainer(containerName, {
            image: ContainerImage.fromAsset(path.join(__dirname, "task"), {
                file: "Dockerfile",
                platform: Platform.LINUX_AMD64
            }),
            logging: LogDriver.awsLogs({
                streamPrefix: streamPrefix
            }),
            environment: {
                METRICS_TABLE_NAME: metricsTable.tableName
            }
        });

        // Create a security group for the task
        this.securityGroup = new SecurityGroup(this, "MetricsTaskSG", {
            vpc: this.cluster.vpc,
            allowAllOutbound: false
        });
        
        // Allow outbound traffic to any IPv4 address
        this.securityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(443), "Allow HTTPS to ECR");

        // Add permissions
        metricsTable.grantWriteData(this.taskDefinition.taskRole);
    }
}