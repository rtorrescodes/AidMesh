import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';
import { EventsService } from './events.service';
import { EventType, EventStatus, DeploymentProfile } from './event.entity';

class CreateEventDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EventType)
  type: EventType;

  @IsOptional()
  @IsEnum(DeploymentProfile)
  deployment_profile?: DeploymentProfile;

  @IsOptional()
  @IsNumber()
  escalation_timeout_min?: number;

  @IsOptional()
  @IsObject()
  zone?: Record<string, any>;

  @IsOptional()
  @IsString()
  org_id?: string;
}

class TransitionEventDto {
  @IsEnum(EventStatus)
  status: EventStatus;
}

@Controller('events')
@UseGuards(AuthGuard('jwt'))
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto, @Request() req: any) {
    return this.eventsService.create({
      ...dto,
      created_by: req.user.id,
    });
  }

  @Get()
  findAll(@Query('org_id') org_id?: string) {
    return this.eventsService.findAll(org_id);
  }

  @Get('active')
  findActive() {
    return this.eventsService.findActive();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Patch(':id/status')
  transition(
    @Param('id') id: string,
    @Body() dto: TransitionEventDto,
    @Request() req: any,
  ) {
    return this.eventsService.transition(id, dto.status, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateEventDto>) {
    return this.eventsService.update(id, dto);
  }
}