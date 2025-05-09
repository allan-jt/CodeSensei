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
  mergeMetrics,
  roundToTwoDecimals,
} from "../../common/Utils";
import MetricSection from "../../common/MetricSection";

interface AssessmentMetrics {
  timestamp: string;
  metrics: Metric[];
}

interface DashboardPageProps {
  assessmentMetrics: AssessmentMetrics[];
}

function DashboardPage({ assessmentMetrics }: DashboardPageProps) {
  let overallMetrics: Scope[] = [];
  let assessments: {
    timeStamp: string;
    metrics: Scope[];
  }[] = [];

  if (assessmentMetrics.length > 0) {
    overallMetrics = getInvertedMetrics(assessmentMetrics[0].metrics);
    assessments = assessmentMetrics.slice(1).map((assessment) => {
      return {
        timeStamp: assessment.timestamp,
        metrics: mergeMetrics(
          getInvertedMetrics(assessment.metrics),
          overallMetrics
        ),
      };
    });
  }

  return (
    <>
      {assessmentMetrics.length <= 1 && (
        <Group justify="center" align="center" h="500px">
          <Text c="dimmed" size="80px" fw={1000}>
            No Metrics Yet
          </Text>
        </Group>
      )}
      {assessmentMetrics.length > 1 && (
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
                  defaultValue={assessment.timeStamp}
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
                                  metric.overall[attemptIndex].value /
                                    metric.overall[attemptIndex].count
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
