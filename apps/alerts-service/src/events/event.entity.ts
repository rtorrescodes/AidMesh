import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EventStatus {
  PREPARATION = 'preparacion',
  ACTIVE = 'activo',
  CONTAINED = 'contenido',
  CLOSED = 'cerrado',
  ARCHIVED = 'archivo',
}

export enum EventType {
  HURRICANE = 'huracan',
  EARTHQUAKE = 'sismo',
  TSUNAMI = 'tsunami',
  FLOOD = 'inundacion',
  FIRE = 'incendio',
  SEARCH_RESCUE = 'busqueda_rescate',
  PUBLIC_HEALTH = 'salud_publica',
  CIVIL_SECURITY = 'seguridad_civil',
  HUMANITARIAN = 'humanitario',
}

export enum DeploymentProfile {
  BASIC = 'basico',
  SEARCH_RESCUE = 'busqueda_rescate',
  NATURAL_DISASTER = 'desastre_natural',
  MAJOR_CRISIS = 'crisis_mayor',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  type: EventType;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PREPARATION,
  })
  status: EventStatus;

  @Column({
    type: 'enum',
    enum: DeploymentProfile,
    default: DeploymentProfile.BASIC,
  })
  deployment_profile: DeploymentProfile;

  @Column({ nullable: true })
  org_id: string;

  @Column({ nullable: true })
  created_by: string;

  @Column({ type: 'int', default: 30 })
  escalation_timeout_min: number;

  @Column({ type: 'jsonb', nullable: true })
  zone: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  closed_at: Date;
}