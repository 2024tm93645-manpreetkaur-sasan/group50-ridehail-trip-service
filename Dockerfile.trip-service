FROM node:25
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9082
CMD ["node", "index.js"]