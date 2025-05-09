import { Stack, Text, Title } from "@mantine/core";
import { roundToTwoDecimals } from "./Utils";

interface MetricSectionProps {
  label: string;
  current: number | string;
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
  let isBetter = false;
  let roundedOverall = overall;
  let roundedCurrent = current;
  if (typeof current === "number") {
    isBetter = greaterIsBetter ? current >= overall : current <= overall;
    roundedOverall = roundToTwoDecimals(overall);
    roundedCurrent = roundToTwoDecimals(current);
  }
  const currentColor = isBetter ? "teal" : "red";

  return (
    <Stack h="100%" justify="space-between" align="center" p="md" gap={0}>
      <Title order={6}>{label}</Title>
      <Text size="sm" c="dimmed">
        {overall_label}: {roundedOverall}
        {unit}
      </Text>

      <Text size="md" fw={600} c={currentColor}>
        {roundedCurrent}
        {unit}
      </Text>
    </Stack>
  );
}

export default MetricSection;
