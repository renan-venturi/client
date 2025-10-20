import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { ClientService } from './client.service';

const EXCHANGE = 'transactions';

@Injectable()
export class TransactionsConsumer implements OnModuleInit {
  private readonly logger = new Logger(TransactionsConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly clients: ClientService,
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consume(
      'clients.transactions',
      [{ exchange: EXCHANGE, routingKey: 'transaction.created' }],
      async (event: { transactionId: string; senderUserId: string; receiverUserId: string; amount: number }) => {
        const { transactionId, senderUserId, receiverUserId, amount } = event;
        const startedAt = Date.now();
        this.logger.log(`consume:start event=transaction.created id=${transactionId} amount=${amount}`);

        try {
          this.logger.log(`consume:debit:start userId=${senderUserId} amount=${amount}`);
          await this.clients.subtractBalance(senderUserId, { amount });
          this.logger.log(`consume:debit:ok userId=${senderUserId}`);
          this.logger.log(`consume:credit:start userId=${receiverUserId} amount=${amount}`);
          await this.clients.addBalance(receiverUserId, { amount });
          this.logger.log(`consume:credit:ok userId=${receiverUserId}`);

          this.logger.log('consume:publish:start event=transaction.completed');
          await this.rabbitmq.publish(EXCHANGE, 'transaction.completed', {
            transactionId,
            status: 'COMPLETED',
          });

          this.logger.log(`consume:publish:ok event=transaction.completed id=${transactionId} durationMs=${Date.now() - startedAt}`);
        } catch (err) {
          this.logger.warn(`consume:process:fail id=${transactionId} error=${err?.message}`);
          await this.rabbitmq.publish(EXCHANGE, 'transaction.failed', {
            transactionId,
            status: 'FAILED',
          });
          this.logger.error(`consume:publish:ok event=transaction.failed id=${transactionId}`);
        }
      }
    );
  }
}


