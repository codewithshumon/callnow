# Stage 1 — Build
FROM node:22-alpine AS build
WORKDIR /app
ENV CI=true
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate && pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Stage 2 — Production
FROM node:22-alpine AS production
WORKDIR /app
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml* ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
RUN pnpm install --prod --frozen-lockfile
RUN pnpm prisma generate

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["sh", "-c", "if [ -f dist/src/main.js ]; then node dist/src/main.js; else node dist/main.js; fi"]
