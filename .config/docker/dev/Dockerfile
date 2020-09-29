FROM node:alpine

WORKDIR /src
RUN apk add ffmpeg
COPY package*.json ./

RUN npm install

COPY . .

EXPOSE ${PORT}
CMD [ "npm", "run", "dev" ]