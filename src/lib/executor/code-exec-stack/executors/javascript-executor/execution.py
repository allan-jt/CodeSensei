import subprocess
import tempfile
import os
import time
import resource

def run_code(code, test_case):
    wrapper_code = f"{code}\n\nconsole.log(solution({test_case}));"

    with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False) as f:
        f.write(wrapper_code)
        f.flush()
        temp_filename = f.name

    try:
        start_time = time.perf_counter()
        usage_before = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss

        result = subprocess.run(
            ["node", temp_filename],
            capture_output=True,
            text=True,
            timeout=5,
        )

        end_time = time.perf_counter()
        usage_after = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss

        exec_time = end_time - start_time
        mem_kb = usage_after - usage_before

        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip())
        return result.stdout.strip(), exec_time, mem_kb
    finally:
        os.remove(temp_filename)
