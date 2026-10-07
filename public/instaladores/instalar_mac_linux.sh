#!/bin/bash
APP_URL="https://ais-dev-dxsiasqnh4ay4qbx2wopvn-463479387247.us-west2.run.app"
echo "Instalando atalho Minha Loja..."

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open -a "Google Chrome" --args --app="$APP_URL" 2>/dev/null || open "$APP_URL"
else
  # Linux
  google-chrome --app="$APP_URL" 2>/dev/null || xdg-open "$APP_URL"
fi
echo "Aplicativo iniciado!"
