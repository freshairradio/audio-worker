FROM node

WORKDIR /app
RUN apk add ffmpeg

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE ${PORT}
CMD [ "node", "dist/index.js" ]