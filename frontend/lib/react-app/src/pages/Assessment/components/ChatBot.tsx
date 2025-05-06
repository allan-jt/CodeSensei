import { Card, Group, Paper, ScrollArea, Text } from "@mantine/core";
// import { useState } from "react";

interface MessageType {
  sender: "user" | "bot";
  text: string;
}

function ChatBotComponent() {
  //   const [messages, setMessages] = useState<MessageType[]>([]);
  //   const [userMessage, setUserMessage] = useState("");
  const sampleMessages: MessageType[] = [
    { sender: "bot", text: "Hello! How can I help you today?" },
    { sender: "user", text: "What are your hours of operation?" },
    {
      sender: "bot",
      text: "We’re open from 9 AM to 5 PM, Monday through Friday.",
    },
    { sender: "user", text: "Thanks!" },
    {
      sender: "bot",
      text: "You’re welcome! Let me know if you have any other questions.",
    },
    { sender: "bot", text: "Hello! How can I help you today?" },
    { sender: "user", text: "What are your hours of operation?" },
    { sender: "bot", text: "Hello! How can I help you today?" },
    { sender: "user", text: "What are your hours of operation?" },
    { sender: "bot", text: "Hello! How can I help you today?" },
    { sender: "user", text: "What are your hours of operation?" },
  ];

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={500}>
      <ScrollArea h="90%" w="100%" offsetScrollbars scrollHideDelay={500}>
        {sampleMessages.map((msg, index) => (
          <Group
            key={index}
            justify={msg.sender === "user" ? "flex-end" : "flex-start"}
            mb="xs"
          >
            <Paper
              shadow="xs"
              p="sm"
              radius="md"
              withBorder
              style={{
                backgroundColor: msg.sender === "user" ? "#228be6" : "#f1f3f5",
                color: msg.sender === "user" ? "white" : "black",
              }}
            >
              <Text>{msg.text}</Text>
            </Paper>
          </Group>
        ))}
      </ScrollArea>
    </Card>
  );
}

export default ChatBotComponent;
