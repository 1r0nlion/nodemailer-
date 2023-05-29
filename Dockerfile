FROM ghcr.io/puppeteer/puppeteer:20.3.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

USER root

# Copy the file/directory into the container
COPY public /usr/src/app/public/

# Change ownership and permissions
RUN chown -R root:root /usr/src/app/public/ \
    && chmod +r /usr/src/app/public/


CMD ["node", "app.js"]

