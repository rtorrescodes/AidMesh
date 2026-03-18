import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: mqtt.MqttClient;

  onModuleInit() {
    const url = process.env.MQTT_URL || 'mqtt://emqx:1883';
    this.client = mqtt.connect(url, {
      clientId: `alerts-service-${Math.random().toString(16).slice(2)}`,
      clean: true,
      reconnectPeriod: 3000,
    });

    this.client.on('connect', () => {
      console.log('Alerts Service MQTT conectado');
    });

    this.client.on('error', (err) => {
      console.error('MQTT error:', err);
    });
  }

  onModuleDestroy() {
    this.client?.end();
  }

  publish(topic: string, payload: object) {
    if (this.client?.connected) {
      this.client.publish(topic, JSON.stringify(payload), { qos: 1 });
    }
  }
}