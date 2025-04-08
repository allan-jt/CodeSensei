import * as cdk from "aws-cdk-lib";
import { Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class DynamoStack extends cdk.Stack {
  public readonly userTable: Table;
  public readonly questionBankTable: Table;
  public readonly assessmentsTable: Table;
  public readonly assessmentQuestionLocatorTable: Table;
  public readonly metricsTable: Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // USERS
    this.userTable = new Table(this, "UserTable", {
      tableName: "UserTable",
      partitionKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // QUESTION BANK
    this.questionBankTable = new Table(this, "QuestionBankTable", {
      tableName: "QuestionBankTable",
      partitionKey: {
        name: "questionId",
        type: cdk.aws_dynamodb.AttributeType.NUMBER,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ASSESSMENTS
    this.assessmentsTable = new Table(this, "AssessmentsTable", {
      tableName: "AssessmentsTable",
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
    this.assessmentQuestionLocatorTable = new Table(
      this,
      "AssessmentQuestionLocatorTable",
      {
        tableName: "AssessmentQuestionLocatorTable",
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
    this.metricsTable = new Table(this, "MetricsTable", {
      tableName: "MetricsTable",
      partitionKey: {
        name: "userId",
        type: cdk.aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
