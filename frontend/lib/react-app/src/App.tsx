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
import type { Configuration, Question } from "./common/CustomTypes";
import NewAssessentPage from "./pages/NewAssessment/NewAssessent";

interface AppProps {
  socketURL: string;
  httpURL: string;
}

function App({ socketURL, httpURL }: AppProps) {
  const auth = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [question, setQuestion] = useState<Question>();
  const [configuration, setConfiguration] = useState<Configuration>();
  const [questionNumber, setQuestionNumber] = useState<number>(0);

  const fetchQuestion = async (payload: any) => {
    const url = `${httpURL}/assessment`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("Fetched data:", data);
      storeReceivedQuestion(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  };

  const fetchScopeMetrics = async () => {
    const url = `${httpURL}/metrics`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          assessmentId: assessmentId,
        }),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error scope metrics:", error);
    }
  };

  const storeReceivedQuestion = (data: any) => {
    if (!data.questionId) return;
    setQuestionNumber(questionNumber + 1);
    const questionId = data.questionId;
    const questionTitle = data.questionTitle;
    const questionDescription = data.questionDescription;
    const starterCode = data.starterCode;
    const questionTopics = data.questionTopics;
    const questionDifficulty = data.questionDifficulty;
    setQuestion({
      questionId,
      questionTitle,
      questionDescription,
      starterCode,
      questionTopics,
      questionDifficulty,
    });

    setCurrentPage("assessment");
  };

  const nextQuestionHandler = async () => {
    if (!configuration) return;
    if (questionNumber >= configuration.numberOfQuestions) {
      const payload = {
        userId: userId,
        assessmentId: assessmentId,
        type: "end",
      };
      await fetchQuestion(payload);
      setQuestionNumber(0);
      setConfiguration(undefined);
      setQuestion(undefined);
      setAssessmentId("");
      await fetchScopeMetrics();
      return;
    }
    const payload = {
      userId: userId,
      assessmentId: assessmentId,
      type: "ongoing",
    };
    await fetchQuestion(payload);
    await fetchScopeMetrics();
  };

  const pages = [
    {
      name: "login",
      component: <LoginPage onClick={() => auth.signinRedirect()} />,
    },
    {
      name: "dashboard",
      component: <DashboardPage httpURL={httpURL} userId={userId} />,
    },
    {
      name: "assessment",
      component:
        question != undefined ? (
          <AssessmentPage
            userId={userId}
            assessmentId={assessmentId}
            {...question}
            socketURL={socketURL}
            httpURL={httpURL}
            nextQuestionHandler={nextQuestionHandler}
          />
        ) : (
          <NewAssessentPage handleSubmit={setConfiguration} />
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
      console.log(auth.user?.profile.email);
      setUserId(auth.user?.profile.email || "");
    } else {
      setCurrentPage(pages[0].name);
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!configuration) return;
    const {
      selectedTopics,
      selectedDifficulty,
      selectedDuration,
      numberOfQuestions,
    } = configuration;

    const timestamp = new Date().toISOString();
    setAssessmentId(timestamp);
    const payload = {
      userId: userId,
      timestamp: timestamp,
      type: "begin",
      selectedTopics: selectedTopics,
      selectedDifficulty: selectedDifficulty,
      selectedDuration: selectedDuration,
      numberOfQuestions: numberOfQuestions,
    };

    fetchQuestion(payload);
  }, [configuration]);

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

// Begin:
// {
//   "userId": "test_user_1",
//   "timestamp": "2025-05-02T18:10:10.000Z",
//   "type": "begin",
//   "selectedTopics": [
//     "Array",
//     "String",
//     "Graph",
//     "Dynamic Programming",
//     "Stack"
//   ],
//   "selectedDifficulty": [
//     "easy",
//     "medium"
//   ],
//   "selectedDuration": 60,
//   "numberOfQuestions": 3
// }

// Ongoing:
// {
//   "userId": "test_user_1",
//   "assessmentId": "2025-05-02T18:10:10.000Z",
//   "type": "ongoing"
// }
// 7:55
// End:
// {
//   "userId": "test_user_1",
//   "assessmentId": "2025-05-02T18:10:10.000Z",
//   "type": "end"
// }
