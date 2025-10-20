import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch {}
  }

  private async connect() {
    if (this.connection && this.channel) return;
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();
  }

  async assertExchange(exchange: string, type: 'direct' | 'topic' | 'fanout' = 'direct', options?: amqp.Options.AssertExchange) {
    await this.connect();
    await this.channel.assertExchange(exchange, type, { durable: true, ...(options || {}) });
  }

  async publish(exchange: string, routingKey: string, data: any) {
    await this.connect();
    await this.assertExchange(exchange, 'direct');
    const payload = Buffer.from(JSON.stringify(data));
    this.channel.publish(exchange, routingKey, payload, { persistent: true, contentType: 'application/json' });
  }

  async consume(queue: string, bindings: { exchange: string; routingKey: string }[], handler: (data: any) => Promise<void> | void) {
    await this.connect();
    await this.channel.assertQueue(queue, { durable: true });

    for (const { exchange, routingKey } of bindings) {
      await this.assertExchange(exchange, 'direct');
      await this.channel.bindQueue(queue, exchange, routingKey);
    }

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        const raw = msg.content.toString();
        const data = JSON.parse(raw);
        await handler(data);
        this.channel.ack(msg);
      } catch (e) {
        this.channel.nack(msg, false, false);
      }
    }, { noAck: false });
  }
}


