export interface ScopeMetric {
  scopeName: string;
  count: number;
  value: number;
  unit: string;
}

export interface Metric {
  metricName: string;
  scopes: ScopeMetric[];
}

export interface Attempts {
  metric: string[];
  current: number[];
  best: number[];
  unit: string[];
  greaterIsBetter: boolean[];
}

export interface newMetric {
  metricName: string;
  count: number;
  value: number;
  unit: string;
  greaterIsBetter: boolean;
}

export interface Scope {
  scopeName: string;
  metrics: newMetric[];
  overall: newMetric[];
}

export interface MessageType {
  sender: "user" | "bot";
  text: string;
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

export enum Difficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}
export interface Question {
  questionId: string;
  questionTitle: string;
  questionDescription: string;
  questionTopics: Topic[];
  questionDifficulty: Difficulty;
  starterCode: Record<string, string>;
}

export interface Configuration {
  selectedTopics: Topic[];
  selectedDifficulty: Difficulty[];
  selectedDuration: number;
  numberOfQuestions: number;
}
