import { Card, Divider, Group, ScrollArea, Text, Title } from "@mantine/core";
import type { Metric, Scope } from "../../../common/CustomTypes";
import MetricSection from "../../../common/MetricSection";
import {
  getInvertedMetrics,
  mergeMetrics,
  roundToTwoDecimals,
} from "../../../common/Utils";

interface ScopeCardProps {
  metrics: Metric[];
  overallMetrics: Metric[];
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
                    current={roundToTwoDecimals(metric.value / metric.count)}
                    overall={roundToTwoDecimals(
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
