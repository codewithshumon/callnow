# Stage 1 — Build
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2 — Production
FROM node:22-alpine AS production
WORKDIR /app
RUN corepack enable
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/prisma ./prisma
RUN pnpm install --prod --frozen-lockfile
RUN pnpm prisma generate

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/main.js"]
