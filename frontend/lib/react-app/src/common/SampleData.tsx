import type { Attempts, Metric } from "./CustomTypes";

export const assessmentMetrics = [
  // Overall metrics
  {
    timestamp: "overall",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "array#easy", count: 320, value: 120.4, unit: "ms" },
          { scopeName: "dp#medium", count: 210, value: 405.9, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 180,
            value: 690.7,
            unit: "ms",
          },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "array#easy", count: 190, value: 225.5, unit: "MB" },
          { scopeName: "dp#medium", count: 175, value: 410.6, unit: "MB" },
          {
            scopeName: "graph#difficult",
            count: 160,
            value: 290.1,
            unit: "MB",
          },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "array#easy", count: 250, value: 540.2, unit: "ms" },
          { scopeName: "dp#medium", count: 200, value: 460.0, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 190,
            value: 870.9,
            unit: "ms",
          },
        ],
      },
    ],
  },

  // Assessment 1
  {
    timestamp: "2025-05-02T14:30:00Z",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "array#easy", count: 100, value: 40.2, unit: "ms" },
          { scopeName: "dp#medium", count: 60, value: 130.5, unit: "ms" },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "array#easy", count: 90, value: 110.2, unit: "MB" },
          { scopeName: "dp#medium", count: 70, value: 160.3, unit: "MB" },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "array#easy", count: 80, value: 160.1, unit: "ms" },
          { scopeName: "dp#medium", count: 65, value: 140.6, unit: "ms" },
        ],
      },
    ],
  },

  // Assessment 2
  {
    timestamp: "2025-05-03T10:15:00Z",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "graph#difficult", count: 80, value: 310.4, unit: "ms" },
          { scopeName: "dp#medium", count: 80, value: 150.6, unit: "ms" },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "graph#difficult", count: 75, value: 130.7, unit: "MB" },
          { scopeName: "dp#medium", count: 60, value: 130.3, unit: "MB" },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "graph#difficult", count: 90, value: 400.8, unit: "ms" },
          { scopeName: "dp#medium", count: 70, value: 160.0, unit: "ms" },
        ],
      },
    ],
  },

  // Assessment 3
  {
    timestamp: "2025-05-04T18:45:00Z",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "array#easy", count: 120, value: 40.0, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 100,
            value: 380.3,
            unit: "ms",
          },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "array#easy", count: 100, value: 115.1, unit: "MB" },
          { scopeName: "graph#difficult", count: 85, value: 159.4, unit: "MB" },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "array#easy", count: 90, value: 220.0, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 100,
            value: 310.0,
            unit: "ms",
          },
        ],
      },
    ],
  },
];

export const sampleAttempts: Attempts[] = [
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [150, 200, 90],
    best: [120, 180, 95],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [200, 350, 95],
    best: [180, 330, 85],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
  {
    metric: ["Execution Time", "Memory Usage", "Test Cases Passed"],
    current: [90, 150, 80],
    best: [100, 140, 100],
    unit: ["ms", "KB", "%"],
    greaterIsBetter: [false, false, true],
  },
];

export const sampleMetrics: Metric[] = [
  {
    metricName: "execution time",
    scopes: [
      { scopeName: "array#easy", count: 120, value: 45.3, unit: "ms" },
      { scopeName: "dp#medium", count: 85, value: 102.7, unit: "ms" },
      { scopeName: "graph#difficult", count: 60, value: 230.1, unit: "ms" },
    ],
  },
  {
    metricName: "memory usage",
    scopes: [
      { scopeName: "graph#difficult", count: 140, value: 15.2, unit: "MB" },
      { scopeName: "dp#medium", count: 90, value: 28.6, unit: "MB" },
      { scopeName: "array#easy", count: 45, value: 64.9, unit: "MB" },
    ],
  },
  {
    metricName: "time taken",
    scopes: [
      { scopeName: "graph#difficult", count: 78, value: 320.4, unit: "s" },
      { scopeName: "array#easy", count: 52, value: 198.2, unit: "s" },
      { scopeName: "dp#medium", count: 100, value: 88.5, unit: "s" },
    ],
  },
];

export const sampleOverallMetrics: Metric[] = [
  {
    metricName: "execution time",
    scopes: [
      { scopeName: "graph#difficult", count: 95, value: 67.2, unit: "ms" },
      { scopeName: "dp#medium", count: 50, value: 210.3, unit: "ms" },
      { scopeName: "array#easy", count: 110, value: 38.9, unit: "ms" },
    ],
  },
  {
    metricName: "memory usage",
    scopes: [
      { scopeName: "array#easy", count: 60, value: 72.1, unit: "MB" },
      { scopeName: "dp#medium", count: 95, value: 30.3, unit: "MB" },
      { scopeName: "graph#difficult", count: 100, value: 18.7, unit: "MB" },
    ],
  },
  {
    metricName: "time taken",
    scopes: [
      { scopeName: "dp#medium", count: 88, value: 92.4, unit: "s" },
      { scopeName: "graph#difficult", count: 70, value: 310.0, unit: "s" },
      { scopeName: "array#easy", count: 55, value: 180.5, unit: "s" },
    ],
  },
];

export const sampleMessages = [
  { sender: "bot", text: "Hello! How can I help you today?" },
  { sender: "user", text: "What are your hours of operation?" },
  {
    sender: "bot",
    text: "We’re open from 9 AM to 5 PM, Monday through Friday.",
  },
  { sender: "user", text: "Thanks!" },
  {
    sender: "bot",
    text: "You’re welcome! Let me know if you have any other questions.",
  },
  { sender: "bot", text: "Hello! How can I help you today?" },
  { sender: "user", text: "What are your hours of operation?" },
  { sender: "bot", text: "Hello! How can I help you today?" },
  { sender: "user", text: "What are your hours of operation?" },
  { sender: "bot", text: "Hello! How can I help you today?" },
  { sender: "user", text: "What are your hours of operation?" },
];
