import {
  Card,
  Group,
  Text,
  Title,
  Stack,
  ScrollArea,
  Divider,
} from "@mantine/core";

interface AttemptMetric {
  metric: string[];
  current: number[];
  best: number[];
  unit: string[];
  greaterIsBetter: boolean[];
}

interface MetricSectionProps {
  label: string;
  current: number;
  best: number;
  unit: string;
  greaterIsBetter: boolean;
}

function MetricSection({
  label,
  current,
  best,
  unit,
  greaterIsBetter,
}: MetricSectionProps) {
  // Determine if current value is better based on `greaterIsBetter` flag
  const isBetter = greaterIsBetter ? current >= best : current <= best;
  const currentColor = isBetter ? "teal" : "red";

  return (
    <Stack h="100%" justify="space-between" align="center" p="md" gap={0}>
      <Title order={6}>{label}</Title>
      <Text size="sm" c="dimmed">
        Best: {best}
        {unit}
      </Text>

      <Text size="md" fw={600} c={currentColor}>
        {current}
        {unit}
      </Text>
    </Stack>
  );
}

interface MetricCardProps {
  attemptMetrics: AttemptMetric[];
}

function MetricCardComponent({ attemptMetrics }: MetricCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={500}>
      {attemptMetrics.length == 0 && (
        <Group justify="center" align="center" h="100%">
          <Text c="dimmed" size="80px" fw={1000}>
            No attempts yet
          </Text>
        </Group>
      )}
      {attemptMetrics.length > 0 && (
        <ScrollArea
          h="100%"
          w="100%"
          offsetScrollbars
          scrollHideDelay={500}
          p="md"
        >
          {attemptMetrics.map((metric, attemptIndex) => (
            <>
              <Group key={attemptIndex} grow justify="space-between" gap="xl">
                <Title order={4}>Attempt {attemptIndex + 1}</Title>
                {metric.metric.map((label, i) => (
                  <MetricSection
                    key={i}
                    label={label}
                    current={metric.current[i]}
                    best={metric.best[i]}
                    unit={metric.unit[i]}
                    greaterIsBetter={metric.greaterIsBetter[i]}
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

export default MetricCardComponent;
