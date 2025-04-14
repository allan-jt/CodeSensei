import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface LambdaStackProps extends cdk.StackProps {
  endpoint: string;
  collectionName: string;
  role: cdk.aws_iam.Role;
  region: string;
  dynamoTable: TableV2;
}

export class QuestionsLambdaStack extends cdk.Stack {
  public readonly fn: PythonFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    this.fn = new PythonFunction(this, id, {
      entry: __dirname + "/lambda-code",
      runtime: cdk.aws_lambda.Runtime.PYTHON_3_13,
      handler: "handler",
      index: "index.py",
      environment: {
        OPENSEARCH_COLLECTION: props.collectionName,
        OPENSEARCH_ENDPOINT: props.endpoint,
        AWSREGION: props.region,
        DYNAMO_TABLE_NAME: props.dynamoTable.tableName,
      },
      role: props.role,
      timeout: cdk.Duration.seconds(60),
      functionName: "LambdaForOpenSearchService",
    });

    props.dynamoTable.grantReadWriteData(this.fn);
  }
}

/*
  Expected payload during invokation

  FOR INITIAL SEEDING
  {
    "action": "seed"
  }

  FOR QUERYING (both topic and difficulty are optional -- you don't need both!)
  {
    "action": "query",
    "topic": "{topic}",
    "difficulty": "{difficulty}",
  }

*/
