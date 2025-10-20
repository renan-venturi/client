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
        this.logger.log(`Received transaction.created ${transactionId}`);

        try {

          await this.clients.subtractBalance(senderUserId, { amount });
          await this.clients.addBalance(receiverUserId, { amount });

          await this.rabbitmq.publish(EXCHANGE, 'transaction.completed', {
            transactionId,
            status: 'COMPLETED',
          });

          this.logger.log(`Published transaction.completed ${transactionId}`);
        } catch (err) {
          await this.rabbitmq.publish(EXCHANGE, 'transaction.failed', {
            transactionId,
            status: 'FAILED',
          });

          this.logger.error(`Transaction ${transactionId} failed: ${err?.message}`);
        }
      }
    );
  }
}


