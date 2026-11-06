FROM node:24-bookworm

RUN ln -fs /usr/share/zoneinfo/Europe/Kiev /etc/localtime

WORKDIR /node/tms/api

COPY package*.json ./

RUN npm ci --omit=dev


COPY . .

ARG DEV_MODE
# Set environment variable
ENV NODE_ENV=$DEV_MODE

CMD ["./node_modules/.bin/pm2-runtime", "start", "./ecosystem.config.js"]
