import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user) throw new ForbiddenException('Sin autenticación');

    // trust_level 3 = Admin, acceso total
    if (user.trust_level === 3) return true;

    const hasAll = required.every(
      (permission) => user.permissions?.[permission] === true,
    );

    if (!hasAll) {
      throw new ForbiddenException(
        `Permisos requeridos: ${required.join(', ')}`,
      );
    }

    return true;
  }
}