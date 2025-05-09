import { Card, ScrollArea, Text } from "@mantine/core";

interface CodeOutputProps {
  codeOutput: string;
}

function CodeOutputComponent({ codeOutput }: CodeOutputProps) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={500}>
      <ScrollArea
        h="100%"
        w="100%"
        bg="#1e1e1e"
        c="#d4d4d4"
        ff="monospace"
        p="md"
        offsetScrollbars
        scrollHideDelay={500}
      >
        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
          {codeOutput}
        </Text>
      </ScrollArea>
    </Card>
  );
}

export default CodeOutputComponent;
