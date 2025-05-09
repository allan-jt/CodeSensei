import { Badge, Card, Group, Stack, Text, Title } from "@mantine/core";

interface QuestionInfoProps {
  title: string;
  description: string;
  topic: string[];
  difficulty: "easy" | "medium" | "hard";
}

function QuestionInfoComponent({
  title,
  description,
  topic,
  difficulty,
}: QuestionInfoProps) {
  const difficultyColors: Record<QuestionInfoProps["difficulty"], string> = {
    easy: "green",
    medium: "yellow",
    hard: "red",
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={3}>{title}</Title>
          <Badge
            color={difficultyColors[difficulty]}
            variant="filled"
            size="lg"
          >
            {difficulty.toUpperCase()}
          </Badge>
        </Group>

        <Group gap="xs">
          {topic.map((t) => (
            <Badge key={t} color="blue" variant="light">
              {t}
            </Badge>
          ))}
        </Group>

        <Text>{description}</Text>
      </Stack>
    </Card>
  );
}

export default QuestionInfoComponent;

// {
//     assessmentID (timestamp)

//     questionTitle

//     questionDescription

//     starterCode

//     questionTopics (array)

//     questionDifficulty (string)

//     }
