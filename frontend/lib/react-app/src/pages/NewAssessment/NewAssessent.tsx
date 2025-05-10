import { useState } from "react";
import {
  Difficulty,
  Topic,
  type Configuration,
} from "../../common/CustomTypes";
import {
  Button,
  Fieldset,
  Group,
  MultiSelect,
  NumberInput,
} from "@mantine/core";

interface NewAssessentProps {
  handleSubmit: (data: Configuration) => void;
}

function NewAssessentPage({ handleSubmit }: NewAssessentProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty[]>([]);
  const [duration, setDuration] = useState<number>(10);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(1);
  const [disabled, setDisabled] = useState<boolean>(false);

  const handleSubmitNative = () => {
    setDuration(10);
    if (topics.length === 0) {
      alert("Please select at least one topic");
      return;
    }
    if (difficulty.length === 0) {
      alert("Please select at least one difficulty");
      return;
    }
    if (numberOfQuestions < 1 || numberOfQuestions > 10) {
      alert("Number of questions should be between 1 and 10");
      return;
    }

    setDisabled(true);
    const configuration: Configuration = {
      selectedTopics: topics,
      selectedDifficulty: difficulty,
      selectedDuration: duration,
      numberOfQuestions: numberOfQuestions,
    };
    handleSubmit(configuration);
    // setDisabled(false);
  };

  return (
    <Fieldset legend="Select Assessment Configuration" disabled={disabled}>
      <MultiSelect
        label="Topics"
        placeholder="Select topics"
        data={Object.values(Topic)}
        value={topics}
        searchable
        nothingFoundMessage="No topics found"
        onChange={(selected) =>
          setTopics(selected.map((value) => value as Topic))
        }
        withAsterisk
        clearable
      />
      <MultiSelect
        label="Difficulty"
        placeholder="Select difficulty"
        data={Object.values(Difficulty)}
        value={difficulty}
        searchable
        nothingFoundMessage="No topics found"
        onChange={(selected) =>
          setDifficulty(selected.map((value) => value as Difficulty))
        }
        withAsterisk
        clearable
      />
      <NumberInput
        label="Number of Questions"
        placeholder="Enter number of questions"
        value={numberOfQuestions}
        onChange={(value) => setNumberOfQuestions(Number(value))}
        min={1}
        max={10}
      />
      <Group justify="flex-end" mt="md">
        <Button onClick={handleSubmitNative} loading={disabled}>
          Submit
        </Button>
      </Group>
    </Fieldset>
  );
}

export default NewAssessentPage;
