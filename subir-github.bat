@echo off
setlocal
cd /d "%~dp0"

set "GIT_EXE=C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe"

echo ========================================================
echo   Estado del repositorio y commit local
echo ========================================================
"%GIT_EXE%" log -n 1 --oneline
"%GIT_EXE%" remote -v

echo.
echo ========================================================
echo   Limpiando sesion anterior de GitHub y subiendo a origin/main...
echo   (Se abrira una ventana para iniciar sesion con JuanVarela-coder)
echo ========================================================
cmdkey /delete:git:https://github.com >nul 2>&1
cmdkey /delete:LegacyGeneric:target=git:https://github.com >nul 2>&1
"%GIT_EXE%" -c http.sslVerify=false -c "http.curloptResolve=github.com:443:140.82.114.4" push -u origin main --force

pause
