FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json backend/tsconfig.json ./
COPY backend/src ./src

RUN npm ci

EXPOSE 3001
CMD ["npm", "run", "start"]
