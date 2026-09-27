import subprocess
from pathlib import Path

backend = Path(r"C:\Users\LENOVO\Desktop\Ai_main\resq-ai\backend")
py = r"C:\Users\LENOVO\AppData\Local\Programs\Python\Python312\python.exe"
cmd = [py, "-m", "pytest", "-q", "tests/test_simulation.py::test_competition_demo_replans_after_fire_and_rescues_all"]
result = subprocess.run(cmd, cwd=str(backend), capture_output=True, text=True)
out_path = backend / "pytest_last.txt"
out_path.write_text((result.stdout or "") + (result.stderr or ""), encoding="utf-8")
print(f"RETURN_CODE={result.returncode}")
print((result.stdout or result.stderr)[:2000])
