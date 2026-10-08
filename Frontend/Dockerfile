# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app

# NEXT_PUBLIC_* values are baked into the JS at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- run ----
# `next dev` (the old CMD) is unoptimized: no minification, no image cache, on-demand compiling.
# Any Lighthouse run against it measures the dev server, not the site.
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./next.config.js

EXPOSE 3000
CMD ["npm", "run", "start"]
