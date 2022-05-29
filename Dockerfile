FROM node:16-alpine
WORKDIR /usr/src/app
COPY . .
RUN apk add --no-cache --virtual .build-deps alpine-sdk libtool autoconf automake python3 \
    && npm install \
    && apk del .build-deps \
    && npm run build \
    && npm prune --production
CMD [ "npm", "start" ]
