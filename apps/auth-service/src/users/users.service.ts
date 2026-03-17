import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, TrustLevel } from './user.entity';
import { Role } from '../roles/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Role)
    private rolesRepo: Repository<Role>,
  ) {}

  async create(data: {
    email: string;
    password: string;
    name: string;
    trust_level?: TrustLevel;
    role_name?: string;
    org_id?: string;
  }): Promise<User> {
    const exists = await this.usersRepo.findOne({
      where: { email: data.email },
    });
    if (exists) throw new ConflictException('Email ya registrado');

    const hashed = await bcrypt.hash(data.password, 10);

    let role: Role | null = null;
    if (data.role_name) {
      role = await this.rolesRepo.findOne({ where: { name: data.role_name } });
    }

    const user = this.usersRepo.create({
      email: data.email,
      password: hashed,
      name: data.name,
      trust_level: data.trust_level ?? TrustLevel.VOLUNTEER,
      org_id: data.org_id,
      role: role ?? undefined,
    });

    return this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepo.find({
      select: ['id', 'email', 'name', 'trust_level', 'org_id', 'is_active', 'created_at'],
    });
  }
}