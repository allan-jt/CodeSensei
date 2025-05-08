import { Card, Group, Paper, ScrollArea, Text, TextInput } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

interface MessageType {
  sender: "user" | "bot";
  text: string;
}

function ChatBotComponent() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (userMessage.trim() === "") return;

    const newMessage: MessageType = {
      sender: "user",
      text: userMessage,
    };
    const newMessages: MessageType[] = [...messages, newMessage];
    setMessages(newMessages);
    const newUserMessage = userMessage;
    setUserMessage("");

    setTimeout(() => {
      setMessages([
        ...newMessages,
        { sender: "bot", text: `Received ${newUserMessage}` },
      ]);
    }, 500);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder h={500}>
      <ScrollArea
        h="90%"
        w="100%"
        offsetScrollbars
        scrollHideDelay={500}
        p="md"
      >
        {messages.map((msg, index) => (
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
        <div ref={scrollRef} />
      </ScrollArea>
      <Group grow>
        <TextInput
          placeholder="Type a message..."
          value={userMessage}
          variant="filled"
          onChange={(e) => setUserMessage(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
      </Group>
    </Card>
  );
}

export default ChatBotComponent;
