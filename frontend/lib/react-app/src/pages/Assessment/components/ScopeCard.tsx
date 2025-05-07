import { Card, Divider, Group, ScrollArea, Text, Title } from "@mantine/core";
import type { Metric } from "../../../CustomTypes";
import MetricSection from "./MetricSection";

interface ScopeCardProps {
  metrics: Metric[];
  overallMetrics: Metric[];
}

interface newMetric {
  metricName: string;
  count: number;
  value: number;
  unit: string;
  greaterIsBetter: boolean;
}

interface Scope {
  scopeName: string;
  metrics: newMetric[];
  overall: newMetric[];
}

function getInvertedMetrics(metrics: Metric[]): Scope[] {
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

function mergeMetrics(metrics: Scope[], overallMetrics: Scope[]): Scope[] {
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

function roundToTwoD(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function ScopeCardComponent({ metrics, overallMetrics }: ScopeCardProps) {
  const refinedMetrics: Scope[] = mergeMetrics(
    getInvertedMetrics(metrics),
    getInvertedMetrics(overallMetrics)
  );

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={500}>
      {refinedMetrics.length == 0 && (
        <Group justify="center" align="center" h="100%">
          <Text c="dimmed" size="80px" fw={1000}>
            No scopes yet
          </Text>
        </Group>
      )}

      {refinedMetrics.length > 0 && (
        <ScrollArea
          h="100%"
          w="100%"
          offsetScrollbars
          scrollHideDelay={500}
          p="md"
        >
          {refinedMetrics.map((scope, attemptIndex) => (
            <>
              <Group key={attemptIndex} grow justify="space-between" gap="xl">
                <Title order={4}>{scope.scopeName}</Title>
                {scope.metrics.map((metric, i) => (
                  <MetricSection
                    key={i}
                    label={metric.metricName}
                    current={roundToTwoD(metric.value / metric.count)}
                    overall={roundToTwoD(
                      refinedMetrics[attemptIndex].overall[i].value /
                        refinedMetrics[attemptIndex].overall[i].count
                    )}
                    overall_label="Overall"
                    unit={metric.unit}
                    greaterIsBetter={metric.greaterIsBetter}
                  />
                ))}
              </Group>
              <Divider my="sm" />
            </>
          ))}
        </ScrollArea>
      )}
    </Card>
  );
}

export default ScopeCardComponent;
