import {
  Accordion,
  Divider,
  Group,
  Text,
  Timeline,
  Title,
} from "@mantine/core";
import { IconBrandSpeedtest } from "@tabler/icons-react";
import type { Metric, Scope } from "../../common/CustomTypes";
import {
  getInvertedMetrics,
  inferUnit,
  mergeMetrics,
  roundToTwoDecimals,
} from "../../common/Utils";
import MetricSection from "../../common/MetricSection";
import { useEffect, useState } from "react";

interface AssessmentMetrics {
  timestamp: string;
  metrics: Metric[];
}

interface DashboardPageProps {
  httpURL: string;
  userId: string;
}

function DashboardPage({ httpURL, userId }: DashboardPageProps) {
  const [overallMetrics, setOverallMetrics] = useState<Scope[]>([]);
  const [assessments, setAssessments] = useState<
    {
      timeStamp: string;
      metrics: Scope[];
    }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      const url = `${httpURL}/dashboard`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: userId }),
        });

        const data = await response.json();
        console.log("Fetched data:", data);

        const assessmentMetrics: AssessmentMetrics[] = data.data.map(
          (entry: any) => ({
            timestamp: entry.type,
            metrics: entry.metrics.map((metric: any) => ({
              metricName: metric.metricName,
              scopes: metric.scopes.map((scope: any) => ({
                scopeName: scope.scopeName,
                count: scope.count,
                value: scope.value,
                unit: inferUnit(metric.metricName),
              })),
            })),
          })
        );

        if (assessmentMetrics.length === 0) {
          console.log("No metrics found");
          return;
        }
        const curOverallMetrics = getInvertedMetrics(
          assessmentMetrics[0].metrics
        );
        setOverallMetrics(curOverallMetrics);

        const curAssessmentMetrics = assessmentMetrics
          .slice(1)
          .map((assessment) => {
            return {
              timeStamp: assessment.timestamp,
              metrics: mergeMetrics(
                getInvertedMetrics(assessment.metrics),
                curOverallMetrics
              ),
            };
          });
        setAssessments(curAssessmentMetrics);

        console.log("Merged metrics:", curAssessmentMetrics);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [httpURL, userId]);

  return (
    <>
      {assessments.length < 1 && (
        <Group justify="center" align="center" h="500px">
          <Text c="dimmed" size="80px" fw={1000}>
            No Metrics Yet
          </Text>
        </Group>
      )}
      {assessments.length > 0 && (
        <Timeline active={0} bulletSize={35} lineWidth={5}>
          <Timeline.Item
            key="overall"
            bullet={<IconBrandSpeedtest size={25} />}
            title={
              <Accordion variant="contained" radius="md" defaultValue="overall">
                <Accordion.Item value="overall">
                  <Accordion.Control>Overall</Accordion.Control>
                  <Accordion.Panel>
                    {overallMetrics.map((metric, attemptIndex) => (
                      <>
                        <Group
                          key={attemptIndex}
                          grow
                          justify="space-between"
                          gap="xl"
                        >
                          <Title order={4}>{metric.scopeName}</Title>
                          {metric.metrics.map((m, i) => (
                            <MetricSection
                              key={i}
                              label={m.metricName}
                              current={roundToTwoDecimals(m.value / m.count)}
                              overall={roundToTwoDecimals(m.value / m.count)}
                              overall_label="Overall"
                              unit={m.unit}
                              greaterIsBetter={m.greaterIsBetter}
                            />
                          ))}
                        </Group>
                        <Divider my="sm" />
                      </>
                    ))}
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>
            }
          />

          {assessments.map((assessment) => (
            <Timeline.Item
              key={assessment.timeStamp}
              bullet={<IconBrandSpeedtest size={25} />}
              title={
                <Accordion
                  variant="contained"
                  radius="md"
                  // defaultValue={assessment.timeStamp}
                >
                  <Accordion.Item value={assessment.timeStamp}>
                    <Accordion.Control>
                      {assessment.timeStamp}
                    </Accordion.Control>
                    <Accordion.Panel>
                      {assessment.metrics.map((metric, attemptIndex) => (
                        <>
                          <Group
                            key={attemptIndex}
                            grow
                            justify="space-between"
                            gap="xl"
                          >
                            <Title order={4}>{metric.scopeName}</Title>
                            {metric.metrics.map((m, i) => (
                              <MetricSection
                                key={i}
                                label={m.metricName}
                                current={roundToTwoDecimals(m.value / m.count)}
                                overall={roundToTwoDecimals(
                                  metric.overall[i].value /
                                    metric.overall[i].count
                                )}
                                overall_label="Overall"
                                unit={m.unit}
                                greaterIsBetter={m.greaterIsBetter}
                              />
                            ))}
                          </Group>
                          <Divider my="sm" />
                        </>
                      ))}
                    </Accordion.Panel>
                  </Accordion.Item>
                </Accordion>
              }
            />
          ))}
        </Timeline>
      )}
    </>
  );
}

export default DashboardPage;
