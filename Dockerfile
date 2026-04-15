FROM node:22.12-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@10.32.1

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22.12-slim

WORKDIR /app
COPY --from=builder /app/dist ./dist

RUN npm install -g serve

EXPOSE 80
CMD ["serve", "dist", "-l", "80"]
