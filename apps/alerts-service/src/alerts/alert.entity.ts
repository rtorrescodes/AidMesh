import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';

export enum AlertSeverity {
  GREEN = 'verde',
  YELLOW = 'amarillo',
  ORANGE = 'naranja',
  RED = 'rojo',
}

export enum AlertType {
  HURRICANE = 'huracan',
  EARTHQUAKE = 'sismo',
  TSUNAMI = 'tsunami',
  FLOOD = 'inundacion',
  FIRE = 'incendio',
  SEARCH_RESCUE = 'busqueda_rescate',
  PUBLIC_HEALTH = 'salud_publica',
  CIVIL_SECURITY = 'seguridad_civil',
}

export enum AlertStatus {
  ACTIVE = 'activa',
  RESOLVED = 'resuelta',
}

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.YELLOW,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 1.0 })
  radius_km: number;

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  org_id: string;

  @ManyToOne(() => Event, { nullable: false })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column()
  event_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  resolved_at: Date;

  @Column({ nullable: true })
  resolved_by: string;
}