import {
  AppShell,
  Burger,
  Button,
  Container,
  Group,
  Stack,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import DashboardPage from "./pages/Dashboard/Dashboard";
import AssessmentPage from "./pages/Assessment/Assessment";

function App() {
  // const socketURL = (window as any).env.SOCKET_API_URL;

  const pages = [
    {
      name: "dashboard",
      component: <DashboardPage />,
    },
    {
      name: "assessment",
      component: <AssessmentPage />,
    },
  ];

  const [opened, { toggle }] = useDisclosure(true);
  const [currentPage, setCurrentPage] = useState(pages[0].name);

  const currentPageComponent = pages.find(
    (page) => page.name === currentPage
  )?.component;

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: !opened },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} size="sm" />
          <Title order={1}>CodeSensei</Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Title order={4}>Navigation</Title>
        <Stack p="lg">
          {pages.map((page) => (
            <Button
              key={page.name}
              variant={currentPage === page.name ? "filled" : "light"}
              onClick={() => setCurrentPage(page.name)}
            >
              {page.name.charAt(0).toUpperCase() + page.name.slice(1)}
            </Button>
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="md" py="lg">
          {currentPageComponent}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default App;
