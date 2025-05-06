import { Stack, Text, Title } from "@mantine/core";

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

export default MetricSection;
