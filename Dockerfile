FROM node:24.15.0-alpine AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/schema/package.json packages/schema/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
COPY packages/schema packages/schema

ARG VITE_DATA_MODE=supabase
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_DATA_MODE=$VITE_DATA_MODE
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN test "$VITE_DATA_MODE" = "supabase" \
  && test -n "$VITE_SUPABASE_URL" \
  && test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" \
  && pnpm --filter @formaglyph/web build

FROM node:24.15.0-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build --chown=node:node /app/apps/web/dist ./dist
COPY --chown=node:node apps/web/server.mjs ./server.mjs

USER node
EXPOSE 3000

CMD ["node", "server.mjs"]
