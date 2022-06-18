FROM node:16-alpine AS builder
RUN apk -U upgrade
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
RUN npm ci --production && npm cache clean
COPY --from=builder /usr/src/app/dist ./dist
CMD [ "npm", "start" ]
