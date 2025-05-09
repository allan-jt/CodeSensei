import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Queue } from "aws-cdk-lib/aws-sqs";

interface MetricsSqsStackProps extends cdk.StackProps {
    queueName: string;
}

export class MetricsSqsStack extends cdk.Stack {
    public readonly queue: Queue;

    constructor(scope: Construct, id: string, props: MetricsSqsStackProps) {
        super(scope, id, props);

        const { queueName } = props;

        this.queue = new Queue(this, "MetricsQueue", {
            queueName: queueName
        });
    }
}