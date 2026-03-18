export enum TrustLevel {
  CITIZEN = 0,
  VOLUNTEER = 1,
  OPERATOR = 2,
  ADMIN = 3,
}

export interface User {
  id: string
  email: string
  name: string
  trust_level: TrustLevel
  permissions: Record<string, boolean>
  org_id?: string
}

export interface AuthState {
  user: User | null
  access_token: string | null
  refresh_token: string | null
}

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

export interface AidMeshEvent {
  id: string
  name: string
  description?: string
  type: EventType
  status: EventStatus
  deployment_profile: DeploymentProfile
  escalation_timeout_min: number
  zone?: Record<string, any>
  org_id?: string
  created_by?: string
  created_at: string
  updated_at: string
  closed_at?: string
}

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

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  status: AlertStatus
  title?: string
  description?: string
  latitude: number
  longitude: number
  radius_km: number
  event_id: string
  created_by?: string
  created_at: string
  resolved_at?: string
}

export enum TicketStatus {
  OPEN = 'abierto',
  ASSIGNED = 'asignado',
  IN_PROGRESS = 'en_progreso',
  RESOLVED = 'resuelto',
  CLOSED = 'cerrado',
}

export enum TicketPriority {
  LOW = 'baja',
  MEDIUM = 'media',
  HIGH = 'alta',
  CRITICAL = 'critica',
}

export enum NeedType {
  FOOD = 'alimento',
  WATER = 'agua',
  MEDICAL = 'medico',
  SHELTER = 'albergue',
  RESCUE = 'rescate',
  TRANSPORT = 'transporte',
  SUPPLIES = 'suministros',
  SECURITY = 'seguridad',
}

export interface COMTicket {
  id: string
  event_id: string
  need_type: NeedType
  resource_category: string
  priority: TicketPriority
  status: TicketStatus
  quantity?: number
  latitude: number
  longitude: number
  description?: string
  report_count: number
  created_by?: string
  assigned_to?: string
  org_id?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export enum SignalStatus {
  PENDING = 'pendiente',
  REVIEWED = 'revisada',
  CONFIRMED = 'confirmada',
  REJECTED = 'rechazada',
}

export interface CitizenSignal {
  id: string
  event_id: string
  raw_message: string
  latitude?: number
  longitude?: number
  contact_info?: string
  status: SignalStatus
  linked_ticket_id?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
}

export const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  [AlertSeverity.GREEN]: '#1d9e75',
  [AlertSeverity.YELLOW]: '#f5c518',
  [AlertSeverity.ORANGE]: '#f07d18',
  [AlertSeverity.RED]: '#e53935',
}

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: '#1d9e75',
  [TicketPriority.MEDIUM]: '#f5c518',
  [TicketPriority.HIGH]: '#f07d18',
  [TicketPriority.CRITICAL]: '#e53935',
}