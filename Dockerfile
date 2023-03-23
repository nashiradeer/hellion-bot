FROM node:16-alpine AS deps
RUN apk -U upgrade && npm i -g npm
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add --virtual .build-deps make libtool autoconf automake gcc g++ libc-dev python3 && \
    NODE_ENV=production npm ci && \
    apk del .build-deps

FROM deps AS builder
RUN npm i
COPY . .
RUN npm run build
RUN find . -not -name "*.js" -exec rm {} \;

FROM deps
COPY --from=builder /usr/src/app/dist ./dist
CMD [ "node", "dist/app.js" ]
