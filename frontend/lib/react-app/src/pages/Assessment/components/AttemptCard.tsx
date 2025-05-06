import { Card, Group, Text, Title, ScrollArea, Divider } from "@mantine/core";
import MetricSection from "./MetricSection";
import type { Attempts } from "../../../CustomTypes";

interface AttemptCardProps {
  attempts: Attempts[];
}

function AttemptCardComponent({ attempts }: AttemptCardProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={500}>
      {attempts.length == 0 && (
        <Group justify="center" align="center" h="100%">
          <Text c="dimmed" size="80px" fw={1000}>
            No attempts yet
          </Text>
        </Group>
      )}
      {attempts.length > 0 && (
        <ScrollArea
          h="100%"
          w="100%"
          offsetScrollbars
          scrollHideDelay={500}
          p="md"
        >
          {attempts.map((metric, attemptIndex) => (
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

export default AttemptCardComponent;
