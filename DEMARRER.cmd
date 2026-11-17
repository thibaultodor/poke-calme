@echo off
setlocal
pushd "%~dp0"
where bun >nul 2>&1
if not errorlevel 1 goto bun
where npx.cmd >nul 2>&1
if errorlevel 1 goto missing
echo Premier lancement : preparation de Bun avec Node.js. Cela peut prendre une minute.
call npx.cmd --yes bun@1.4.4 install --frozen-lockfile
if errorlevel 1 goto failed
echo Garde cette fenetre ouverte pendant la seance. Ctrl+C pour arreter.
call npx.cmd --yes bun@1.4.4 run dev --host 127.0.0.1 --open
goto end
:bun
call bun install --frozen-lockfile
if errorlevel 1 goto failed
echo Garde cette fenetre ouverte pendant la seance. Ctrl+C pour arreter.
call bun run dev --host 127.0.0.1 --open
goto end
:missing
echo Installe Node.js LTS ou Bun, puis relance ce fichier.
echo https://nodejs.org/ ou https://bun.sh/docs/installation
pause
goto end
:failed
echo La preparation a echoue. Verifie la connexion Internet au premier lancement.
echo Les informations sont affichees ci-dessus.
pause
:end
popd
