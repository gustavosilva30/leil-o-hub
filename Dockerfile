FROM node:20-bullseye-slim AS build

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  fontconfig \
  wget \
  gnupg \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json backend/tsconfig.json ./
RUN npm ci
RUN npx playwright install --with-deps chromium

COPY backend/src ./src

ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "run", "start"]
