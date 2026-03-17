import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertSeverity, AlertStatus, AlertType } from './alert.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertsRepo: Repository<Alert>,
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
    return this.alertsRepo.save(alert);
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
    return this.alertsRepo.save(alert);
  }

  async update(id: string, data: Partial<Alert>): Promise<Alert> {
    const alert = await this.findById(id);
    Object.assign(alert, data);
    return this.alertsRepo.save(alert);
  }
}