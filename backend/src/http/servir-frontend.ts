import * as path from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

// Em produção a API serve o build do front no mesmo domínio: um container, sem CORS.
// Rotas que não são /api nem arquivo estático caem no index.html (SPA).
export function servirFrontend(app: NestExpressApplication, dist: string) {
  const index = path.join(dist, 'index.html');
  app.useStaticAssets(dist);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(index);
  });
}
