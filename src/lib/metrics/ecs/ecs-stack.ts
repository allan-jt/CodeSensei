import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Cluster, FargateTaskDefinition, ContainerImage, LogDriver } from "aws-cdk-lib/aws-ecs";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { ApplicationLoadBalancedFargateService } from "aws-cdk-lib/aws-ecs-patterns";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";

interface MetricsEcsStackProps extends cdk.StackProps {
    clusterName: string;
    taskDefinitionName: string;
    containerName: string;
    streamPrefix: string;
    loadBalancerName: string;
    metricsTable: TableV2;
    assessmentsTable: TableV2;
}

export class MetricsEcsStack extends cdk.Stack {
    public readonly loadBalancer: ApplicationLoadBalancedFargateService;

    constructor(scope: Construct, id: string, props: MetricsEcsStackProps) {
        super(scope, id, props);

        const { clusterName, taskDefinitionName, containerName, streamPrefix, loadBalancerName, metricsTable, assessmentsTable } = props;

        // Create an ECS cluster
        const cluster = new Cluster(this, "MetricsCluster", {
            clusterName: clusterName
        });

        // Create a Fargate task definition
        const taskDefinition = new FargateTaskDefinition(this, taskDefinitionName, {
            cpu: 256,
            memoryLimitMiB: 512
        });

        // Add a container to the task definition
        taskDefinition.addContainer(containerName, {
            image: ContainerImage.fromAsset(path.join(__dirname, "service"), {
                file: "Dockerfile",
                platform: Platform.LINUX_AMD64
            }),
            logging: LogDriver.awsLogs({ streamPrefix: streamPrefix }),
            portMappings: [{ containerPort: 80 }],
            environment: {
                METRICS_TABLE_NAME: metricsTable.tableName,
                ASSESSMENTS_TABLE_NAME: assessmentsTable.tableName
            }
        });

        // Create a load-balanced Fargate service
        this.loadBalancer = new ApplicationLoadBalancedFargateService(this, "MetricsService", {
            loadBalancerName: loadBalancerName,
            cluster: cluster,
            taskDefinition: taskDefinition,
            publicLoadBalancer: true,
            desiredCount: 1
        });

        // Add permissions
        metricsTable.grantReadWriteData(taskDefinition.taskRole);
        assessmentsTable.grantReadWriteData(taskDefinition.taskRole);
    }
}