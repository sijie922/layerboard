# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace config
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY packages/server/package.json ./packages/server/
COPY packages/client/package.json ./packages/client/

# Install deps (workspace root)
RUN pnpm install --frozen-lockfile

# Build client
COPY packages/client/ ./packages/client/
RUN pnpm --filter layerboard-client build

# ---- Runtime stage ----
FROM nginx:alpine AS runtime
COPY --from=build /app/packages/client/dist /usr/share/nginx/html

# SPA fallback
RUN printf 'server {\n\
  listen 80;\n\
  location / {\n\
    root /usr/share/nginx/html;\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
