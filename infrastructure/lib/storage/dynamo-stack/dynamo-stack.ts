import * as cdk from "aws-cdk-lib";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { DynamoTables } from "./schema/dynamo-schemas";

export class DynamoStack extends cdk.Stack {
  public readonly userTable: TableV2;
  public readonly questionBankTable: TableV2;
  public readonly assessmentsTable: TableV2;
  public readonly assessmentQuestionLocatorTable: TableV2;
  public readonly metricsTable: TableV2;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // USERS
    this.userTable = new TableV2(this, DynamoTables.USERS, {
      tableName: DynamoTables.USERS,
      partitionKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // QUESTION BANK
    this.questionBankTable = new TableV2(this, DynamoTables.QUESTION_BANK, {
      tableName: DynamoTables.QUESTION_BANK,
      partitionKey: {
        name: "questionId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ASSESSMENTS
    this.assessmentsTable = new TableV2(this, DynamoTables.ASSESSMENTS, {
      tableName: DynamoTables.ASSESSMENTS,
      partitionKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "timestamp",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ASSESSMENT QUESTION LOCATOR
    this.assessmentQuestionLocatorTable = new TableV2(
      this,
      DynamoTables.ASSESSMENT_QUESTION_LOCATOR,
      {
        tableName: DynamoTables.ASSESSMENT_QUESTION_LOCATOR,
        partitionKey: {
          name: "userId",
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: "scope",
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // METRICS
    this.metricsTable = new TableV2(this, DynamoTables.METRICS, {
      tableName: DynamoTables.METRICS,
      partitionKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
