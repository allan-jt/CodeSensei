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
