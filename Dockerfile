# Bloom (coffee-app) — static SPA served behind coffee-journal-bff by nginx.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Unprivileged nginx: runs as non-root (uid 101) and listens on 8080 by default,
# so it works under the k8s `runAsNonRoot` security context without extra fuss.
FROM nginxinc/nginx-unprivileged:alpine-slim
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 8080
