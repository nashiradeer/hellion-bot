FROM node:16-alpine
RUN apk add --no-cache alpine-sdk libtool autoconf automake python3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN apk del alpine-sdk libtool autoconf automake python3
RUN apk cache clean
COPY . .
RUN npm run build
RUN npm prune --production
CMD [ "npm", "start" ]
