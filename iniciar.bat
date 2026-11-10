@echo off
setlocal
cd /d "%~dp0"

set "ELECTRON_RUN_AS_NODE=1"
set "NODE_EXE=C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Microsoft\VisualStudio\NodeJs\node.exe"

if not exist "%NODE_EXE%" (
    set "NODE_EXE=%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
)
if not exist "%NODE_EXE%" (
    set "NODE_EXE=%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe"
)

echo ========================================================
echo   Iniciando Platform-X Anime (Web :3000, API :4000, AI :8000)
echo ========================================================
"%NODE_EXE%" start-all.js

