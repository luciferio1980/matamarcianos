@echo off
title AETHER RAZE
cd /d "%~dp0"
where python >nul 2>nul
if %ERRORLEVEL%==0 (
  python play.py
  goto :eof
)
where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py -3 play.py
  goto :eof
)
echo No se encontro Python. Abriendo el juego directamente en el navegador...
start "" "%~dp0index.html"
