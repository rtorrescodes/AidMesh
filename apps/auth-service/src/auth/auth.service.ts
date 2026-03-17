import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TrustLevel } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    name: string;
    trust_level?: TrustLevel;
    role_name?: string;
    org_id?: string;
  }) {
    const user = await this.usersService.create(data);
    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    if (!user.is_active) throw new UnauthorizedException('Usuario inactivo');

    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const permissions = user.role?.permissions ?? {};

    const payload = {
      sub: user.id,
      email: user.email,
      trust_level: user.trust_level,
      permissions,
      org_id: user.org_id ?? null,
    };

    const access_token = this.jwtService.sign(payload);

    const refresh_token = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        trust_level: user.trust_level,
        permissions,
      },
    };
  }
}