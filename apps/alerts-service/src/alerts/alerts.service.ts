import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertSeverity, AlertStatus, AlertType } from './alert.entity';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertsRepo: Repository<Alert>,
    private mqttService: MqttService,
  ) {}

  async create(data: {
    type: AlertType;
    severity: AlertSeverity;
    title?: string;
    description?: string;
    latitude: number;
    longitude: number;
    radius_km?: number;
    event_id: string;
    created_by?: string;
    org_id?: string;
  }): Promise<Alert> {
    const alert = this.alertsRepo.create({
      ...data,
      status: AlertStatus.ACTIVE,
    });
    const saved = await this.alertsRepo.save(alert);

    // Publicar en MQTT
    this.mqttService.publish('alerts/new', {
      alert_id: saved.id,
      event_id: saved.event_id,
      type: saved.type,
      severity: saved.severity,
      title: saved.title,
      latitude: saved.latitude,
      longitude: saved.longitude,
      timestamp: saved.created_at,
    });

    this.mqttService.publish('com/broadcast/alert', {
      alert_id: saved.id,
      event_id: saved.event_id,
      severity: saved.severity,
      title: saved.title,
      timestamp: saved.created_at,
    });

    return saved;
  }

  async findAll(event_id?: string): Promise<Alert[]> {
    const where: any = {};
    if (event_id) where.event_id = event_id;
    return this.alertsRepo.find({
      where,
      relations: ['event'],
      order: { created_at: 'DESC' },
    });
  }

  async findActive(event_id?: string): Promise<Alert[]> {
    const where: any = { status: AlertStatus.ACTIVE };
    if (event_id) where.event_id = event_id;
    return this.alertsRepo.find({
      where,
      relations: ['event'],
      order: { severity: 'DESC', created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Alert> {
    const alert = await this.alertsRepo.findOne({
      where: { id },
      relations: ['event'],
    });
    if (!alert) throw new NotFoundException(`Alerta ${id} no encontrada`);
    return alert;
  }

  async resolve(id: string, userId: string): Promise<Alert> {
    const alert = await this.findById(id);
    alert.status = AlertStatus.RESOLVED;
    alert.resolved_at = new Date();
    alert.resolved_by = userId;
    const saved = await this.alertsRepo.save(alert);

    // Publicar resolución en MQTT
    this.mqttService.publish('alerts/resolved', {
      alert_id: saved.id,
      event_id: saved.event_id,
      resolved_by: userId,
      timestamp: saved.resolved_at,
    });

    return saved;
  }

  async update(id: string, data: Partial<Alert>): Promise<Alert> {
    const alert = await this.findById(id);
    Object.assign(alert, data);
    return this.alertsRepo.save(alert);
  }
}