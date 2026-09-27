$root = 'C:\Users\LENOVO\Desktop\Ai_main\resq-ai'
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$py = 'C:\Users\LENOVO\AppData\Local\Programs\Python\Python312\python.exe'
$node = Get-Command npm -ErrorAction Stop

Set-Location $backend
$pyOut = & $py -m pytest -q 2>&1 | Out-String
Set-Content -Path (Join-Path $root 'backend_pytest.log') -Value $pyOut -Encoding utf8

Set-Location $frontend
$buildOut = & $node.Source run build 2>&1 | Out-String
Set-Content -Path (Join-Path $root 'frontend_build.log') -Value $buildOut -Encoding utf8

Write-Output "BACKEND_PYTEST_EXIT:$LASTEXITCODE"
Write-Output "FRONTEND_BUILD_EXIT:$LASTEXITCODE"
Write-Output $pyOut
Write-Output $buildOut
