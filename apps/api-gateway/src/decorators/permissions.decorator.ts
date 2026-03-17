import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Public = () => SetMetadata('isPublic', true);

// Permisos atómicos del sistema — fuente de verdad
export const Permissions = {
  // Alertas
  ALERTS_READ: 'alerts:read',
  ALERTS_CREATE: 'alerts:create',
  ALERTS_RESOLVE: 'alerts:resolve',

  // COM
  COM_SEND_STRUCTURED: 'com:send_structured',
  COM_SEND_OPEN: 'com:send_open',
  COM_MANAGE_TEMPLATES: 'com:manage_templates',

  // Vehículos
  VEHICLES_TRACK: 'vehicles:track',
  VEHICLES_MANAGE: 'vehicles:manage',

  // Eventos
  EVENTS_CREATE: 'events:create',
  EVENTS_MANAGE: 'events:manage',
  EVENTS_CLOSE: 'events:close',

  // Ciudadanos
  CITIZENS_REVIEW_SIGNALS: 'citizens:review_signals',

  // Admin
  ADMIN_MANAGE_USERS: 'admin:manage_users',
  ADMIN_MANAGE_ROLES: 'admin:manage_roles',
} as const;