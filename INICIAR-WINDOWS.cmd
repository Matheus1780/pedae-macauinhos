@echo off
setlocal DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js 22.13 ou mais recente e abra este arquivo novamente.
  pause
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)"
if errorlevel 1 (
  echo Atualize o Node.js para a versao 22.13 ou mais recente.
  pause
  exit /b 1
)
node "%~dp0scripts\start-local.cjs"
if errorlevel 1 pause
