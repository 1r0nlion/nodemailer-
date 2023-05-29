FROM ghcr.io/puppeteer/puppeteer:20.3.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

USER node



RUN --chown=node:node /usr/src/app/public/pdf; chmod +r /usr/src/app/public/pdf

CMD ["node", "app.js"]

