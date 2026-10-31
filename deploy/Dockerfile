# Tech Epitome production image. Build from the repository root:
#   docker build -f deploy/Dockerfile -t tech-epitome:<git-sha> .
#
# Two targets:
#   app       the Next.js standalone server, non-root, no build tools
#   migrator  the same source with full dependencies, for `prisma migrate
#             deploy` (and the seed in a rehearsal). It never serves traffic.
#
# The build needs no database and no secrets: SKIP_ENV_VALIDATION lets
# `next build` run without them, and every data-backed page renders at
# request time. Secrets arrive only at runtime, from an env file outside
# the repository.

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN npm ci --ignore-scripts && npx prisma generate

FROM deps AS build
COPY . .
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    SKIP_ENV_VALIDATION=true \
    DATABASE_URL=postgresql://build:build@127.0.0.1:1/build
# The production hostname; CI passes it explicitly (vars.PRODUCTION_APP_URL).
ARG NEXT_PUBLIC_APP_URL=https://tech-epitome.cloude5.tech
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN npm run build && rm -f .next/standalone/.env*

FROM deps AS migrator
COPY . .
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM ${NODE_IMAGE} AS app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health?ready=1').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
