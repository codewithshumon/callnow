# syntax=docker.io/docker/dockerfile:1
FROM node:22-alpine AS base
ENV CI=true
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8010
ARG NEXT_PUBLIC_WS_URL=ws://localhost:8010
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml* ./
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
