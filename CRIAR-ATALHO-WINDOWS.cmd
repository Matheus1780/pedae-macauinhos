@echo off
setlocal DisableDelayedExpansion
chcp 65001 >nul
set "PEDEAE_ROOT=%~dp0"
powershell.exe -NoProfile -Command "$ErrorActionPreference='Stop'; $root=$env:PEDEAE_ROOT; $desktop=[Environment]::GetFolderPath('DesktopDirectory'); $shell=New-Object -ComObject WScript.Shell; $shortcut=$shell.CreateShortcut((Join-Path $desktop 'PedeAe (teste).lnk')); $shortcut.TargetPath=Join-Path $root 'INICIAR-WINDOWS.cmd'; $shortcut.WorkingDirectory=$root; $shortcut.Description='Abrir o PedeAe no navegador'; $shortcut.IconLocation=$env:SystemRoot+'\System32\shell32.dll,14'; $shortcut.Save()"
if errorlevel 1 (
  echo Nao foi possivel criar o atalho. Voce pode abrir pelo INICIAR-WINDOWS.cmd.
  if /I not "%~1"=="/quiet" pause
  exit /b 1
)
echo Pronto! Use o atalho PedeAe (teste) na sua Area de Trabalho.
echo Mantenha a pasta do projeto neste local para o atalho continuar funcionando.
if /I not "%~1"=="/quiet" pause
