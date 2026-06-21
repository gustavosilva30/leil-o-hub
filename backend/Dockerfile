FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm ci

EXPOSE 3001
CMD ["npm", "run", "start"]
