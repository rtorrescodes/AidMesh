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
} from 'class-validator';
import { AlertsService } from './alerts.service';
import { AlertType, AlertSeverity } from './alert.entity';

class CreateAlertDto {
  @IsEnum(AlertType)
  type: AlertType;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  radius_km?: number;

  @IsString()
  event_id: string;
}

@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Post()
  create(@Body() dto: CreateAlertDto, @Request() req: any) {
    return this.alertsService.create({
      ...dto,
      created_by: req.user.id,
      org_id: req.user.org_id,
    });
  }

  @Get()
  findAll(@Query('event_id') event_id?: string) {
    return this.alertsService.findAll(event_id);
  }

  @Get('active')
  findActive(@Query('event_id') event_id?: string) {
    return this.alertsService.findActive(event_id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.alertsService.findById(id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Request() req: any) {
    return this.alertsService.resolve(id, req.user.id);
  }
}