@echo off
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
echo Preparando o PedeAe. Aguarde a instalacao dos componentes...
call npm.cmd ci
if errorlevel 1 (
  echo A instalacao nao terminou. Confira a conexao e as mensagens acima.
  pause
  exit /b 1
)
echo Abrindo o app no navegador. Mantenha esta janela aberta.
call npm.cmd run web
pause
