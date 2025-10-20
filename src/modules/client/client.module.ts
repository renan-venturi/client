import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { TransactionsConsumer } from './transactions.consumer';

@Module({
  imports: [RabbitMQModule],
  controllers: [ClientController],
  providers: [ClientService, PrismaService, TransactionsConsumer],
  exports: [ClientService],
})
export class ClientModule {}
