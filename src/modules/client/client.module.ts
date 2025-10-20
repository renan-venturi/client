import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RabbitMQModule } from '../../rabbitmq/rabbitmq.module';
import { RedisModule } from '../../common/redis/redis.module';
import { TransactionsConsumer } from './transactions.consumer';

@Module({
  imports: [RabbitMQModule, RedisModule],
  controllers: [ClientController],
  providers: [ClientService, PrismaService, TransactionsConsumer],
  exports: [ClientService],
})
export class ClientModule {}
