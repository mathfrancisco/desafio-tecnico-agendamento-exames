# Imagem única: a API NestJS serve /api e o build do front-end no mesmo domínio.

FROM node:24-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24-bookworm-slim AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/agendamentos.db \
    EXAMES_CSV_PATH=/app/dados/exames.csv \
    FRONTEND_DIST=/app/public
WORKDIR /app
COPY --from=backend /app/backend/package.json ./backend/
COPY --from=backend /app/backend/node_modules ./backend/node_modules
COPY --from=backend /app/backend/dist ./backend/dist
COPY --from=frontend /app/frontend/dist ./public
COPY dados ./dados
# /data é o volume persistente do SQLite. Roda como root porque volumes de PaaS
# (Kubernetes) costumam montar com dono root e o SQLite precisa escrever neles.
RUN mkdir -p /data
WORKDIR /app/backend
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main"]
