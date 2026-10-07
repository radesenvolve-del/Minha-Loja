@echo off
chcp 65001 > nul
title Instalador - Minha Loja Gestão e PDV
color 0A

echo ======================================================
echo       INSTALADOR - MINHA LOJA (GESTÃO & PDV)
echo ======================================================
echo.
echo Criando atalho na sua Área de Trabalho...
echo.

set "APP_URL=https://ais-dev-dxsiasqnh4ay4qbx2wopvn-463479387247.us-west2.run.app"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_PATH=%DESKTOP%\Minha Loja - PDV.url"

echo [InternetShortcut] > "%SHORTCUT_PATH%"
echo URL=%APP_URL% >> "%SHORTCUT_PATH%"
echo IconIndex=0 >> "%SHORTCUT_PATH%"
echo IconFile=%SystemRoot%\System32\shell32.dll >> "%SHORTCUT_PATH%"

echo.
echo [OK] Atalho criado com sucesso na sua Área de Trabalho!
echo.
echo Abrindo o aplicativo em modo janela nativa...

start "" msedge --app="%APP_URL%" 2>nul || start "" chrome --app="%APP_URL%" 2>nul || start "" "%APP_URL%"

echo.
echo Aplicativo instalado e iniciado com sucesso!
echo Pressione qualquer tecla para fechar esta janela.
pause > nul
exit
