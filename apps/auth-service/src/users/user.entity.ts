import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../roles/role.entity';

export enum TrustLevel {
  CITIZEN = 0,
  VOLUNTEER = 1,
  OPERATOR = 2,
  ADMIN = 3,
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TrustLevel,
    default: TrustLevel.VOLUNTEER,
  })
  trust_level: TrustLevel;

  @Column({ nullable: true })
  org_id: string;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => Role, { nullable: true, eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}