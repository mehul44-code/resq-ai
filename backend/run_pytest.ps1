$py = "C:\Users\LENOVO\AppData\Local\Programs\Python\Python312\python.exe"
Set-Location $PSScriptRoot
$result = & $py -m pytest -q 2>&1 | Out-String
Set-Content -Path "$PSScriptRoot\pytest_verify.txt" -Value $result -Encoding utf8
Write-Output $result
