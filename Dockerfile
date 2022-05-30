FROM node:16-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add --no-cache --virtual .build-deps alpine-sdk libtool autoconf automake python3 \
    && npm install --omit=dev --include=optional \
    && apk del .build-deps
COPY . .
RUN npm install --include=dev --include=optional \
    && npm run build \
    && npm prune --omit=dev --include=optional
CMD [ "npm", "start" ]
