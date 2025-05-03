import subprocess
import tempfile
import os
import time
import resource

with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
    wrapper_code = f"print(\"hello World!\")"
    f.write(wrapper_code)
    f.flush()
    temp_filename = f.name

    try:
        start_time = time.perf_counter()
        usage_before = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
        result = subprocess.run(
            ["python3", temp_filename],
            capture_output=True,
            text=True,
            timeout=5,
        )
        end_time = time.perf_counter()
        usage_after = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss

        exec_time = end_time - start_time
        mem_kb = usage_after - usage_before
        print(f"Execution time: {exec_time}")
        print(f"Memory: {mem_kb}")

        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip())
        print(result.stdout.strip())
    finally:
        os.remove(temp_filename)