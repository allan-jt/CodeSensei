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
import { useEffect, useState } from "react";
import DashboardPage from "./pages/Dashboard/Dashboard";
import AssessmentPage from "./pages/Assessment/Assessment";
import { useAuth } from "react-oidc-context";
import LoginPage from "./pages/LogIn/Login";

interface AppProps {
  socketURL: string;
}

function App({ socketURL }: AppProps) {
  const auth = useAuth();

  const pages = [
    {
      name: "login",
      component: <LoginPage onClick={() => auth.signinRedirect()} />,
    },
    {
      name: "dashboard",
      component: <DashboardPage assessmentMetrics={[]} />,
    },
    {
      name: "assessment",
      component: (
        <AssessmentPage
          userId="u001"
          assessmentId="2025-04-09T12:00:00Z"
          questionId="1"
          questionTitle="Two Sum"
          questionDescription="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target."
          questionTopics={["Array", "Two Pointers"]}
          questionDifficulty="easy"
          starterCode={{
            python:
              "def solution(nums, target):\n    # Your code here\n    pass",
            javascript:
              "function solution(nums, target) {\n  // Your code here\n}",
          }}
          socketURL={socketURL}
          nextQuestionHandler={(data) => {
            console.log("Next question data:", data);
          }}
        />
      ),
    },
  ];

  const [opened, { toggle }] = useDisclosure(true);
  const [currentPage, setCurrentPage] = useState(
    auth.isAuthenticated ? pages[1].name : pages[0].name
  );

  useEffect(() => {
    if (auth.isAuthenticated) {
      setCurrentPage(pages[1].name);
    } else {
      setCurrentPage(pages[0].name);
    }
  }, [auth.isAuthenticated]);

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
          {pages.slice(1).map((page) => (
            <Button
              key={page.name}
              variant={currentPage === page.name ? "filled" : "light"}
              onClick={() => setCurrentPage(page.name)}
              disabled={!auth.isAuthenticated}
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
