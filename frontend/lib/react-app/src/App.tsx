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

const assessmentMetrics = [
  // Overall metrics
  {
    timestamp: "overall",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "array#easy", count: 320, value: 120.4, unit: "ms" },
          { scopeName: "dp#medium", count: 210, value: 405.9, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 180,
            value: 690.7,
            unit: "ms",
          },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "array#easy", count: 190, value: 225.5, unit: "MB" },
          { scopeName: "dp#medium", count: 175, value: 410.6, unit: "MB" },
          {
            scopeName: "graph#difficult",
            count: 160,
            value: 290.1,
            unit: "MB",
          },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "array#easy", count: 250, value: 540.2, unit: "ms" },
          { scopeName: "dp#medium", count: 200, value: 460.0, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 190,
            value: 870.9,
            unit: "ms",
          },
        ],
      },
    ],
  },

  // Assessment 1
  {
    timestamp: "2025-05-02T14:30:00Z",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "array#easy", count: 100, value: 40.2, unit: "ms" },
          { scopeName: "dp#medium", count: 60, value: 130.5, unit: "ms" },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "array#easy", count: 90, value: 110.2, unit: "MB" },
          { scopeName: "dp#medium", count: 70, value: 160.3, unit: "MB" },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "array#easy", count: 80, value: 160.1, unit: "ms" },
          { scopeName: "dp#medium", count: 65, value: 140.6, unit: "ms" },
        ],
      },
    ],
  },

  // Assessment 2
  {
    timestamp: "2025-05-03T10:15:00Z",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "graph#difficult", count: 80, value: 310.4, unit: "ms" },
          { scopeName: "dp#medium", count: 80, value: 150.6, unit: "ms" },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "graph#difficult", count: 75, value: 130.7, unit: "MB" },
          { scopeName: "dp#medium", count: 60, value: 130.3, unit: "MB" },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "graph#difficult", count: 90, value: 400.8, unit: "ms" },
          { scopeName: "dp#medium", count: 70, value: 160.0, unit: "ms" },
        ],
      },
    ],
  },

  // Assessment 3
  {
    timestamp: "2025-05-04T18:45:00Z",
    metrics: [
      {
        metricName: "execution time",
        scopes: [
          { scopeName: "array#easy", count: 120, value: 40.0, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 100,
            value: 380.3,
            unit: "ms",
          },
        ],
      },
      {
        metricName: "memory usage",
        scopes: [
          { scopeName: "array#easy", count: 100, value: 115.1, unit: "MB" },
          { scopeName: "graph#difficult", count: 85, value: 159.4, unit: "MB" },
        ],
      },
      {
        metricName: "time taken",
        scopes: [
          { scopeName: "array#easy", count: 90, value: 220.0, unit: "ms" },
          {
            scopeName: "graph#difficult",
            count: 100,
            value: 310.0,
            unit: "ms",
          },
        ],
      },
    ],
  },
];

interface AppProps {
  cognitoDomain: string;
  redirectUri: string;
  clientId: string;
}

function App({ cognitoDomain, redirectUri, clientId }: AppProps) {
  const auth = useAuth();
  // const signOutRedirect = () => {
  //   window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(
  //     redirectUri
  //   )}`;
  // };
  console.log(cognitoDomain);
  console.log(redirectUri);
  console.log(clientId);

  // const socketURL = (window as any).env.SOCKET_API_URL;

  const pages = [
    {
      name: "login",
      component: <LoginPage onClick={() => auth.signinRedirect()} />,
    },
    {
      name: "dashboard",
      component: <DashboardPage assessmentMetrics={assessmentMetrics} />,
    },
    {
      name: "assessment",
      component: <AssessmentPage />,
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
