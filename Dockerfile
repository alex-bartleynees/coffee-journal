# Bloom (coffee-app) — static SPA build served by nginx.
# VITE_BFF=true bakes BFF mode in: cookie auth via /bff/*, sync via same-origin
# /api/sync (the coffee-journal-bff instance fronts this container). Build with
# --build-arg VITE_BFF=false for a standalone build (dev stand-in auth).

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_BFF=true
ENV VITE_BFF=$VITE_BFF
RUN npm run build

FROM nginx:alpine-slim
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 8080
