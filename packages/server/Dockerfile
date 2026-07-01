# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

RUN pnpm install --frozen-lockfile

COPY packages/server/ ./packages/server/
RUN pnpm --filter layerboard-server build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/packages/server/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/server/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
