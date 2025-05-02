import subprocess
import tempfile
import os
import boto3
# import time

# import resource
from dynamo_schemas import QuestionRecord, DynamoTables


def get_question_by_id(question_id) -> QuestionRecord:
    """
    Fetches a question record from DynamoDB by its ID.
    """
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(DynamoTables.QUESTION_BANK.value)
    response = table.get_item(Key={"questionId": question_id})
    if "Item" in response:
        question_record = QuestionRecord(**response["Item"])
        return question_record
    return None


def run_code_against_tests(code, test_cases, expected_outputs):
    results = []
    for test_case, expected_output in zip(test_cases, expected_outputs):
        try:
            result = run_code(code, test_case)
            passed = str(result).strip() == str(expected_output).strip()
            results.append(
                {
                    "test_case": test_case,
                    "expected_output": expected_output,
                    "result": result,
                    "passed": passed,
                    # "exec_time": exec_time,
                    # "mem_kb": mem_kb,
                }
            )
        except Exception as e:
            results.append(
                {
                    "test_case": test_case,
                    "expected_output": expected_output,
                    "result": str(e),
                    "passed": False,
                }
            )
    return results


def run_code(code, test_case):
    wrapper_code = f"{code}\n\nconsole.log(solution({test_case}));"

    with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False) as f:
        f.write(wrapper_code)
        f.flush()
        temp_filename = f.name

    try:
        result = subprocess.run(
            ["node", temp_filename],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip())
        return result.stdout.strip()
    finally:
        os.remove(temp_filename)
