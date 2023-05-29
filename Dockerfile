FROM ghcr.io/puppeteer/puppeteer:20.3.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .


# Copy the file/directory into the container
COPY public /usr/src/app/public/
# Copy the image file into the container
COPY ./public/img/logo2.png /usr/src/app/public/img/logo2.png

USER root
# Change ownership and permissions of the copied image file
RUN chown root:root /usr/src/app/public/img/logo2.png \
    && chmod 644 /usr/src/app/public/img/logo2.png
# Change ownership and permissions
RUN chown -R root:root /usr/src/app/public/ \
    && chmod +r /usr/src/app/public/


CMD ["node", "app.js"]

