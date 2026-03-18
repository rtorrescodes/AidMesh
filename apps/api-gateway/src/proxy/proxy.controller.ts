import { All, Controller, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

const SERVICES: Record<string, string> = {
  '/api/auth': process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  '/api/alerts': process.env.ALERTS_SERVICE_URL || 'http://alerts-service:3002',
  '/api/events': process.env.ALERTS_SERVICE_URL || 'http://alerts-service:3002',
  '/api/layers': process.env.MAPS_SERVICE_URL || 'http://maps-service:3003',
  '/api/routes': process.env.MAPS_SERVICE_URL || 'http://maps-service:3003',
  '/api/tickets': process.env.COM_SERVICE_URL || 'http://com-service:3004',
  '/api/signals': process.env.COM_SERVICE_URL || 'http://com-service:3004',
};

function resolveTarget(path: string): string | null {
  for (const prefix of Object.keys(SERVICES)) {
    if (path.startsWith(prefix)) {
      return SERVICES[prefix];
    }
  }
  return null;
}

@Controller()
export class ProxyController {
  constructor(private readonly http: HttpService) {}

@All('*')
async proxy(@Req() req: Request, @Res() res: Response) {
    const target = resolveTarget(req.path);

    if (!target) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    const url = `${target}${req.path}`;

    try {
      const response = await firstValueFrom(
        this.http.request({
          method: req.method as any,
          url,
          data: req.body,
          headers: {
            'Content-Type': 'application/json',
            ...(req.headers.authorization
              ? { Authorization: req.headers.authorization }
              : {}),
          },
          params: req.query,
          validateStatus: () => true,
        }),
      );

      return res.status(response.status).json(response.data);
    } catch (err: any) {
      return res.status(502).json({ error: 'Error conectando al servicio' });
    }
  }
}