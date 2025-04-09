import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import {
  AssessmentRecord,
  DynamoTables,
  MetricsRecord,
  QuestionLocatorRecord,
  QuestionRecord,
  UserRecord,
} from "../schema/dynamo-schemas";
import { marshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

const tables = {
  users: DynamoTables.USERS,
  questions: DynamoTables.QUESTION_BANK,
  assessments: DynamoTables.ASSESSMENTS,
  locator: DynamoTables.ASSESSMENT_QUESTION_LOCATOR,
  metrics: DynamoTables.METRICS,
};

const dataFiles = {
  users: "../data/users.json",
  questions: "../data/questions.json",
  assessments: "../data/assessments.json",
  locator: "../data/question-locator.json",
  metrics: "../data/metrics.json",
};

type RecordType = {
  users: UserRecord;
  questions: QuestionRecord;
  assessments: AssessmentRecord;
  locator: QuestionLocatorRecord;
  metrics: MetricsRecord;
};

const getTableName = (arg: string) => {
  return tables[arg as keyof typeof tables];
};

const getDataFile = (arg: string) => {
  return dataFiles[arg as keyof typeof dataFiles];
};

const seedUsers = async (items: RecordType[], table: DynamoTables) => {
  for (const item of items) {
    const params = {
      TableName: table,
      Item: marshall(item),
    };

    const command = new PutItemCommand(params);

    try {
      await dynamo.send(command);
    } catch (error) {
      console.error(`Failed to insert ${item}`, error);
    }
  }
};

const userArg = process.argv[2];
const tableName = getTableName(userArg);
const dataFile = getDataFile(userArg);
const items = JSON.parse(
  fs.readFileSync(path.join(__dirname, dataFile), "utf-8")
);

seedUsers(items, tableName);
