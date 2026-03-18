import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { MqttService } from '../mqtt/mqtt.service';

@Module({
  imports: [TypeOrmModule.forFeature([Alert])],
  providers: [AlertsService, MqttService],
  controllers: [AlertsController],
  exports: [AlertsService],
})
export class AlertsModule {}