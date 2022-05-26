FROM node:16-alpine
RUN apk add alpine-sdk libtool autoconf automake python3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN apk del alpine-sdk libtool autoconf automake python3
COPY . .
RUN npm run build
CMD [ "npm", "start" ]