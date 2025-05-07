import { Stack, Text, Title } from "@mantine/core";

interface MetricSectionProps {
  label: string;
  current: number;
  overall: number;
  overall_label: string;
  unit: string;
  greaterIsBetter: boolean;
}

function MetricSection({
  label,
  current,
  overall,
  overall_label,
  unit,
  greaterIsBetter,
}: MetricSectionProps) {
  const isBetter = greaterIsBetter ? current >= overall : current <= overall;
  const currentColor = isBetter ? "teal" : "red";

  return (
    <Stack h="100%" justify="space-between" align="center" p="md" gap={0}>
      <Title order={6}>{label}</Title>
      <Text size="sm" c="dimmed">
        {overall_label}: {overall}
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
