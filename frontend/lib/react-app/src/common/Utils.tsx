import type { Metric, Scope } from "./CustomTypes";

export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function getInvertedMetrics(metrics: Metric[]): Scope[] {
  if (metrics.length === 0) return [];
  const scopeMap: Record<string, Scope> = {};

  for (const metric of metrics) {
    for (const scopeMetric of metric.scopes) {
      if (!scopeMap[scopeMetric.scopeName]) {
        scopeMap[scopeMetric.scopeName] = {
          scopeName: scopeMetric.scopeName,
          metrics: [],
          overall: [],
        };
      }

      scopeMap[scopeMetric.scopeName].metrics.push({
        metricName: metric.metricName,
        count: scopeMetric.count,
        value: scopeMetric.value,
        unit: scopeMetric.unit,
        greaterIsBetter: false,
      });
    }
  }

  return Object.values(scopeMap);
}

export function mergeMetrics(
  metrics: Scope[],
  overallMetrics: Scope[]
): Scope[] {
  if (metrics.length === 0) return [];
  const mergedMetrics: Scope[] = [];

  for (const metric of metrics) {
    const overallMetric = overallMetrics.find(
      (m) => m.scopeName === metric.scopeName
    );

    if (overallMetric) {
      mergedMetrics.push({
        ...metric,
        overall: overallMetric.metrics,
      });
    } else {
      mergedMetrics.push(metric);
    }
  }

  return mergedMetrics;
}
