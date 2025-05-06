import type { Metric } from "../../../CustomTypes";

interface ScopeCardProps {
  metrics: Metric[];
  overallMetrics: Metric[];
}

interface newMetric {
  metricName: string;
  count: number;
  value: number;
  unit: string;
}

interface Scope {
  scopeName: string;
  metrics: newMetric[];
}

function getInvertedMetrics(metrics: Metric[]): Scope[] {
  const scopeMap: Record<string, Scope> = {};

  for (const metric of metrics) {
    for (const scopeMetric of metric.scopes) {
      if (!scopeMap[scopeMetric.scopeName]) {
        scopeMap[scopeMetric.scopeName] = {
          scopeName: scopeMetric.scopeName,
          metrics: [],
        };
      }

      scopeMap[scopeMetric.scopeName].metrics.push({
        metricName: metric.metricName,
        count: scopeMetric.count,
        value: scopeMetric.value,
        unit: scopeMetric.unit,
      });
    }
  }

  return Object.values(scopeMap);
}

function ScopeCardComponent({ metrics, overallMetrics }: ScopeCardProps) {
  const sMetrics: Scope[] = getInvertedMetrics(metrics);
  const sOverallMetrics: Scope[] = getInvertedMetrics(overallMetrics);
}

export default ScopeCardComponent;
