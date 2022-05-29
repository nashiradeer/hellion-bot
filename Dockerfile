FROM node:16-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps alpine-sdk libtool autoconf automake python3 \
    && npm install --production \
    && apk del .build-deps
COPY . .
RUN npm install --production=false \
    && npm run build \
    && npm prune --production
CMD [ "npm", "start" ]
