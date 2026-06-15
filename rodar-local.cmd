@echo off
cd /d "%~dp0"
echo.
echo Iniciando DATAVERA em ambiente local...
echo.
echo Quando aparecer "Ready", acesse:
echo http://localhost:3003
echo.
echo Mantenha esta janela aberta enquanto estiver usando o site.
echo.
npm.cmd run dev
echo.
echo O servidor foi encerrado.
pause
