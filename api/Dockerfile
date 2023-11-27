FROM node:18

RUN ln -fs /usr/share/zoneinfo/Europe/Kiev /etc/localtime
   
WORKDIR /node/tms/api
   
COPY package*.json ./
   
RUN npm install --verbose

RUN npm install pm2 -g
   
COPY . .

ENV NODE_ENV production

CMD pm2-runtime start ./ecosystem.config.js
