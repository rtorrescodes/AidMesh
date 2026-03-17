import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus, EventType, DeploymentProfile } from './event.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepo: Repository<Event>,
  ) {}

  async create(data: {
    name: string;
    description?: string;
    type: EventType;
    deployment_profile?: DeploymentProfile;
    escalation_timeout_min?: number;
    zone?: Record<string, any>;
    org_id?: string;
    created_by?: string;
  }): Promise<Event> {
    const event = this.eventsRepo.create({
      ...data,
      status: EventStatus.PREPARATION,
    });
    return this.eventsRepo.save(event);
  }

  async findAll(org_id?: string): Promise<Event[]> {
    const where = org_id ? { org_id } : {};
    return this.eventsRepo.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<Event> {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) throw new NotFoundException(`Evento ${id} no encontrado`);
    return event;
  }

  async findActive(): Promise<Event[]> {
    return this.eventsRepo.find({
      where: { status: EventStatus.ACTIVE },
      order: { created_at: 'DESC' },
    });
  }

  async transition(id: string, newStatus: EventStatus, userId?: string): Promise<Event> {
    const event = await this.findById(id);

    const validTransitions: Record<EventStatus, EventStatus[]> = {
      [EventStatus.PREPARATION]: [EventStatus.ACTIVE],
      [EventStatus.ACTIVE]: [EventStatus.CONTAINED, EventStatus.CLOSED],
      [EventStatus.CONTAINED]: [EventStatus.ACTIVE, EventStatus.CLOSED],
      [EventStatus.CLOSED]: [EventStatus.ARCHIVED],
      [EventStatus.ARCHIVED]: [],
    };

    if (!validTransitions[event.status].includes(newStatus)) {
      throw new BadRequestException(
        `Transición inválida: ${event.status} → ${newStatus}`,
      );
    }

    event.status = newStatus;

    if (newStatus === EventStatus.CLOSED) {
      event.closed_at = new Date();
    }

    return this.eventsRepo.save(event);
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    const event = await this.findById(id);
    Object.assign(event, data);
    return this.eventsRepo.save(event);
  }
}