FROM node:16-alpine AS builder
RUN apk -U upgrade
RUN apk add --virtual .build-deps make libtool autoconf automake gcc g++ libc-dev python3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:16-alpine
RUN apk -U upgrade
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add --virtual .build-deps make libtool autoconf automake gcc g++ libc-dev python3 && \
    npm ci --omit=dev && \
    apk del .build-deps
COPY --from=builder /usr/src/app/dist ./dist
CMD [ "npm", "start" ]
