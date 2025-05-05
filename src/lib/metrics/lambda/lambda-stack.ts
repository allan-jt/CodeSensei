import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { Cluster, FargateTaskDefinition } from "aws-cdk-lib/aws-ecs";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { SubnetType } from "aws-cdk-lib/aws-ec2";
import * as path from "path";

interface MetricsLambdaStackProps extends cdk.StackProps {
    lambdaName1: string;
    lambdaName2: string;
    lambdaName3: string;
    ecsCluster: Cluster;
    taskDefinition: FargateTaskDefinition;
    taskSecurityGroup: SecurityGroup
}

export class MetricsLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: MetricsLambdaStackProps) {
        super(scope, id, props);
        
        const { lambdaName1, lambdaName2, lambdaName3, ecsCluster, taskDefinition, taskSecurityGroup } = props;

        const lf4_0 = new Function(this, "LF4_0", {
            functionName: lambdaName1,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_0")),
            handler: "index.handler"
        });
        
        const lf4_1 = new Function(this, "LF4_1", {
            functionName: lambdaName2,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_1")),
            handler: "index.handler",
            environment: {
                CLUSTER_NAME: ecsCluster.clusterName,
                TASK_DEFINITION_ARN: taskDefinition.taskDefinitionArn,
                CONTAINER_NAME: taskDefinition.defaultContainer?.containerName || "",
                SECURITY_GROUP_ID: taskSecurityGroup.securityGroupId,
                SUBNET_IDS: ecsCluster.vpc.selectSubnets({ subnetType: SubnetType.PUBLIC }).subnetIds.join(",")
            }
        });
        
        const lf4_2 = new Function(this, "LF4_2", {
            functionName: lambdaName3,
            runtime: Runtime.PYTHON_3_13,
            code: Code.fromAsset(path.join(__dirname, "lf4_2")),
            handler: "index.handler"
        });

        // Add permissions
        taskDefinition.grantRun(lf4_1);
    }
}