FROM node:20-slim AS web-build
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web ./
RUN npm run build

FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends docker.io procps && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY VERSION ./VERSION
COPY --from=web-build /web/dist ./web/dist
EXPOSE 4000
CMD ["node", "src/server.js"]
