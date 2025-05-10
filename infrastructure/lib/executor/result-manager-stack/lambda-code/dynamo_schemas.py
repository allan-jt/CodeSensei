from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Optional


# TABLE NAMES___________________________________________________________
class DynamoTables(Enum):
    USERS = ("UserTable",)
    QUESTION_BANK = "QuestionBankTable"
    ASSESSMENTS = "AssessmentsTable"
    ASSESSMENT_QUESTION_LOCATOR = "AssessmentQuestionLocatorTable"
    METRICS = "MetricsTable"


# USER TABLE___________________________________________________________
@dataclass
class UserRecord:
    userId: str
    firstName: str
    lastName: str
    email: str
    createdAt: str
    executionSocketUrl: Optional[str] = None
    chatSocketUrl: Optional[str] = None
    currentAssessmentTimestamp: Optional[str] = None


# user: UserRecord = UserRecord()


# QUESTION BANK TABLE__________________________________________________
class Difficulty(Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Topic(Enum):
    ARRAY = "Array"
    STRING = "String"
    HASH_TABLE = "Hash Table"
    DYNAMIC_PROGRAMMING = "Dynamic Programming"
    SORTING = "Sorting"
    GREEDY = "Greedy"
    DEPTH_FIRST_SEARCH = "Depth-First Search"
    BINARY_SEARCH = "Binary Search"
    MATRIX = "Matrix"
    BREADTH_FIRST_SEARCH = "Breadth-First Search"
    TREE = "Tree"
    BIT_MANIPULATION = "Bit Manipulation"
    TWO_POINTERS = "Two Pointers"
    HEAP = "Heap (Priority Queue)"
    BINARY_TREE = "Binary Tree"
    STACK = "Stack"
    GRAPH = "Graph"
    SLIDING_WINDOW = "Sliding Window"
    LINKED_LIST = "Linked List"
    ORDERED_SET = "Ordered Set"
    QUEUE = "Queue"
    RECURSION = "Recursion"


class Language(Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"


@dataclass
class QuestionRecord:
    questionId: str
    topics: List[Topic]  # Array of Topic enums
    difficulty: Difficulty
    title: str
    description: str
    testCases: List[str]
    testAnswers: List[str]
    starterCode: Dict[Language, str]
    hints: List[str]


# METRICS TABLE_________________________________________________________
class MetricTypes(Enum):
    ATTEMPTS = "attempts"
    EXECUTION_TIME = "execution_time"
    EXECUTION_MEMORY = "execution_memory"
    TIME_SPENT = "time_spent"


@dataclass
class MetricsValues:
    count: int
    total: int


@dataclass
class MetricScopes:
    scopes: Dict[str, MetricsValues]


@dataclass
class Metrics:
    metrics: Dict[MetricTypes, MetricScopes]


@dataclass
class MetricsRecord:
    userId: str
    metrics: Metrics


# ASSESSMENTS TABLE____________________________________________________
class Status(Enum):
    COMPLETE = "complete"
    ONGOING = "ongoing"
    INCOMPLETE = "incomplete"


class AttemptStatus(Enum):
    SUCCESS = "success"
    FAIL = "fail"


class QuestionStatus(Enum):
    PASS = "pass"
    INCOMPLETE = "incomplete"
    FAIL = "fail"


@dataclass
class Attempt:
    execTimeTaken: int  # Time taken in seconds
    execMemoryTaken: int  # Memory taken in KB
    status: AttemptStatus  # Status of the attempt (success or fail)


@dataclass
class QuestionsDone:
    questionId: str
    attempts: List[Attempt]
    timeStarted: str
    timeEnded: str
    bestExecTime: int
    bestExecMem: int
    testCasesPassed: int
    status: QuestionStatus


@dataclass
class AssessmentRecord:
    userId: str  # User ID as partition key
    timestamp: str  # Timestamp (as sort key)
    selectedTopics: List[Topic]
    selectedDifficulty: List[Difficulty]
    selectedDuration: int  # Duration in minutes
    selectedNumberOfQuestions: int
    status: Status
    metrics: Metrics
    questions: List[QuestionsDone]


# ASSESSMENT QUESTION LOCATOR TABLE____________________________________
@dataclass
class LocationEntry:
    # assessmentTimestamp -> array of indices
    assessmentTimestamp: Dict[str, List[str]]


@dataclass
class QuestionLocatorRecord:
    userId: str  # User ID as partition key
    scope: str  # Scope as sort key
    location: LocationEntry
