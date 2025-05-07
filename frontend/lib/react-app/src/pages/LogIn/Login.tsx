import { Badge, Button, Card, Group, Image, Text } from "@mantine/core";

interface LoginProps {
  onClick: () => void;
}

function LoginPage({ onClick }: LoginProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={600}>
      <Card.Section>
        <Image
          src="https://coderpad.io/wp-content/uploads/2023/05/10-4-ChatGPT-Prompt-Templates-to-Enhance-Your-Coding-Interview-Process-transparency-1.png"
          height={300}
        />
      </Card.Section>

      <Group justify="space-between" mt="md" mb="xs">
        <Text fw={500}>Welcome to CodeSensei!</Text>
      </Group>

      <Text size="sm" c="dimmed">
        CodeSensei is a cloud-native platform that helps you prepare for coding
        interviews with real-time coding assessments, metrics, and more!
      </Text>

      <Button color="blue" fullWidth mt="md" radius="md" onClick={onClick}>
        Sign in!
      </Button>
    </Card>
  );
}

export default LoginPage;
