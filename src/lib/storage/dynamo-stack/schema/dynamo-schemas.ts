export enum DynamoTables {
  USERS = "UserTable",
  QUESTION_BANK = "QuestionBankTable",
  ASSESSMENTS = "AssessmentsTable",
  ASSESSMENT_QUESTION_LOCATOR = "AssessmentQuestionLocatorTable",
  METRICS = "MetricsTable",
}

// USER TABLE___________________________________________________________
export type UserRecord = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  executionSocketUrl: string | null;
  chatSocketUrl: string | null;
  currentAssessmentTimestamp: string | null;
};

// Example
// let user: UserRecord = {}

// QUESTION BANK TABLE__________________________________________________
export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum Topic {
  ARRAY = "Array",
  STRING = "String",
  HASH_TABLE = "Hash Table",
  DYNAMIC_PROGRAMMING = "Dynamic Programming",
  SORTING = "Sorting",
  GREEDY = "Greedy",
  DEPTH_FIRST_SEARCH = "Depth-First Search",
  BINARY_SEARCH = "Binary Search",
  MATRIX = "Matrix",
  BREADTH_FIRST_SEARCH = "Breadth-First Search",
  TREE = "Tree",
  BIT_MANIPULATION = "Bit Manipulation",
  TWO_POINTERS = "Two Pointers",
  HEAP = "Heap (Priority Queue)",
  BINARY_TREE = "Binary Tree",
  STACK = "Stack",
  GRAPH = "Graph",
  SLIDING_WINDOW = "Sliding Window",
  LINKED_LIST = "Linked List",
  ORDERED_SET = "Ordered Set",
  QUEUE = "Queue",
  RECURSION = "Recursion",
}

export enum Language {
  PYTHON = "python",
  JAVASCRIPT = "javascript",
}

export type QuestionRecord = {
  questionId: string;
  topics: Topic[]; // Array of Topic enums
  difficulty: Difficulty;
  title: string;
  description: string;
  testCases: string[];
  testAnswers: string[];
  ststarterCode: Partial<Record<Language, string>>;
  hints: string[];
};

// METRICS TABLE_________________________________________________________
export enum MetricTypes {
  ATTEMPTS = "attempts",
  EXECUTION_TIME = "execution_time",
  EXECUTION_MEMORY = "execution_memory",
  TIME_SPENT = "time_spent",
}

export type Metrics = Record<
  MetricTypes,
  {
    [scope: string]: {
      count: number;
      total: number;
    };
  }
>;

export type MetricsRecord = {
  userId: string;
  metrics: Metrics;
};

// ASSESSMENTS TABLE____________________________________________________
export enum Status {
  COMPLETE = "complete",
  ONGOING = "ongoing",
  INCOMPLETE = "incomplete",
}

export enum AttemptStatus {
  SUCCESS = "success",
  FAIL = "fail",
}

export enum QuestionStatus {
  PASS = "pass",
  INCOMPLETE = "incomplete",
  FAIL = "fail",
}

export type Attempt = {
  execTimeTaken: number; // Time taken in seconds
  execMemoryTaken: number; // Memory taken in KB
  status: AttemptStatus; // Status of the attempt (success or fail)
};

export type QuestionsDone = {
  questionId: string;
  attempts: Attempt[];
  timeStarted: string;
  timeEnded: string;
  bestExecTime: number;
  bestExecMem: number;
  testCasesPassed: number;
  status: QuestionStatus;
};

export type AssessmentRecord = {
  userId: string; // User ID as partition key
  timestamp: string; // Timestamp (as sort key)
  selectedTopics: Topic[];
  selectedDifficulty: Difficulty[];
  selectedDuration: number; // Duration in minutes
  selectedNumberOfQuestions: number;
  status: Status;
  metrics: Metrics;
  questions: QuestionsDone[];
};

// ASSESSMENT QUESTION LOCATOR TABLE____________________________________
export type LocationEntry = {
  [assessmentTimestamp: string]: string[]; // assessmentTimestamp -> array of indices
};

export type QuestionLocatorRecord = {
  userId: string; // User ID as partition key
  scope: string; // Scope as sort key
  location: LocationEntry;
};
