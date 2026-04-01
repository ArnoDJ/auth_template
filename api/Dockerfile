FROM node:20-alpine

WORKDIR /BK-Connect/api

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

CMD ["node", "dist/main.js"]
