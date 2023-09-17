FROM node:20

RUN mkdir -p /src

WORKDIR /src

COPY . /src

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]