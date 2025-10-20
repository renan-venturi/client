import { Injectable, NotFoundException, ConflictException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto, UpdateProfilePictureDto, UpdateBalanceDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async create(createClientDto: CreateClientDto) {
    try {
      const startedAt = Date.now();
      this.logger.log(`create:start email=${createClientDto.email}`);

      const existingClient = await this.prisma.client.findUnique({
        where: { email: createClientDto.email },
      });

      if (existingClient) {
        this.logger.warn(`create:conflict email=${createClientDto.email}`);
        throw new ConflictException('Email already in use');
      }

      // Criptografar senha
      const hashedPassword = await bcrypt.hash(createClientDto.password, 10);

      const client = await this.prisma.client.create({
        data: {
          ...createClientDto,
          password: hashedPassword,
        },
      });

      // Remover senha da resposta
      const { password, ...clientWithoutPassword } = client;
      this.logger.log(`create:ok id=${client.id} durationMs=${Date.now() - startedAt}`);
      return clientWithoutPassword;
    } catch (error) {
      this.logger.error(`create:fail email=${createClientDto?.email} error=${error?.message}`);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create client');
    }
  }

  async findAll(filterDto?: FilterClientDto) {
    try {
      const startedAt = Date.now();
      const where = {};

      if (filterDto?.name) {
        where['name'] = {
          contains: filterDto.name,
          mode: 'insensitive',
        };
      }

      if (filterDto?.email) {
        where['email'] = {
          contains: filterDto.email,
          mode: 'insensitive',
        };
      }

      const clients = await this.prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          bankingAgency: true,
          bankingAccount: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      this.logger.log(`list:ok count=${clients.length} durationMs=${Date.now() - startedAt}`);
      return clients;
    } catch (error) {
      this.logger.error(`list:fail error=${error?.message}`);
      throw new InternalServerErrorException('Failed to fetch clients');
    }
  }

  async findOne(id: string) {
    try {
      const startedAt = Date.now();
      const cacheKey = `client:${id}`;
      
      // Try to get from cache first
      const cachedClient = await this.redis.get(cacheKey);
      if (cachedClient) {
        this.logger.log(`get:cache_hit id=${id} durationMs=${Date.now() - startedAt}`);
        return JSON.parse(cachedClient);
      }

      this.logger.log(`get:cache_miss id=${id}`);
      const client = await this.prisma.client.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          bankingAgency: true,
          bankingAccount: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!client) {
        this.logger.warn(`get:not_found id=${id}`);
        throw new NotFoundException('Client not found');
      }

      // Cache the result for 5 minutes (300 seconds)
      await this.redis.set(cacheKey, JSON.stringify(client), 300);
      this.logger.log(`get:ok id=${id} durationMs=${Date.now() - startedAt}`);
      return client;
    } catch (error) {
      this.logger.error(`get:fail id=${id} error=${error?.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch client');
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      const startedAt = Date.now();
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        this.logger.warn(`update:not_found id=${id}`);
        throw new NotFoundException('Client not found');
      }

      // Email não pode ser atualizado via UpdateClientDto

      const client = await this.prisma.client.update({
        where: { id },
        data: updateClientDto,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          bankingAgency: true,
          bankingAccount: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      // Invalidate cache
      await this.redis.del(`client:${id}`);
      this.logger.log(`update:ok id=${id} durationMs=${Date.now() - startedAt}`);
      return client;
    } catch (error) {
      this.logger.error(`update:fail id=${id} error=${error?.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update client');
    }
  }

  async remove(id: string) {
    try {
      const startedAt = Date.now();
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        this.logger.warn(`delete:not_found id=${id}`);
        throw new NotFoundException('Client not found');
      }

      await this.prisma.client.delete({
        where: { id },
      });
      // Invalidate cache
      await this.redis.del(`client:${id}`);
      this.logger.log(`delete:ok id=${id} durationMs=${Date.now() - startedAt}`);
      return { message: 'Cliente removido com sucesso' };
    } catch (error) {
      this.logger.error(`delete:fail id=${id} error=${error?.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete client');
    }
  }

  async updateProfilePicture(id: string, updateProfilePictureDto: UpdateProfilePictureDto) {
    try {
      const startedAt = Date.now();
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        this.logger.warn(`updateProfilePicture:not_found id=${id}`);
        throw new NotFoundException('Client not found');
      }

      // Validações extras de segurança
      const { profilePicture } = updateProfilePictureDto;
      
      // Verificar se a URL não é a mesma atual (evitar updates desnecessários)
      if (existingClient.profilePicture === profilePicture) {
        throw new ConflictException('Profile picture is the same');
      }

      // Verificar se a URL não contém caracteres suspeitos
      if (profilePicture.includes('<script>') || profilePicture.includes('javascript:')) {
        throw new BadRequestException('URL contains suspicious content');
      }

      // Verificar se a URL não é muito longa (proteção contra DoS)
      if (profilePicture.length > 500) {
        throw new BadRequestException('URL too long');
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: {
          profilePicture: profilePicture.trim(), // Remove espaços em branco
        },
        select: {
          id: true,
          name: true,
          profilePicture: true,
          updatedAt: true,
        },
      });
      // Invalidate cache
      await this.redis.del(`client:${id}`);
      this.logger.log(`updateProfilePicture:ok id=${id} durationMs=${Date.now() - startedAt}`);
      return client;
    } catch (error) {
      this.logger.error(`updateProfilePicture:fail id=${id} error=${error?.message}`);
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update profile picture');
    }
  }

  async addBalance(id: string, updateBalanceDto: UpdateBalanceDto) {
    try {
      const startedAt = Date.now();
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        this.logger.warn(`addBalance:not_found id=${id}`);
        throw new NotFoundException('Client not found');
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: {
          balance: {
            increment: updateBalanceDto.amount,
          },
        },
        select: {
          id: true,
          name: true,
          balance: true,
          updatedAt: true,
        },
      });
      this.logger.log(`addBalance:ok id=${id} amount=${updateBalanceDto.amount} durationMs=${Date.now() - startedAt}`);
      return client;
    } catch (error) {
      this.logger.error(`addBalance:fail id=${id} amount=${updateBalanceDto?.amount} error=${error?.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add balance');
    }
  }

  async subtractBalance(id: string, updateBalanceDto: UpdateBalanceDto) {
    try {
      const startedAt = Date.now();
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        this.logger.warn(`subtractBalance:not_found id=${id}`);
        throw new NotFoundException('Client not found');
      }

      // Verificar se tem saldo suficiente
      if (existingClient.balance < updateBalanceDto.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const client = await this.prisma.client.update({
        where: { id },
        data: {
          balance: {
            decrement: updateBalanceDto.amount,
          },
        },
        select: {
          id: true,
          name: true,
          balance: true,
          updatedAt: true,
        },
      });
      this.logger.log(`subtractBalance:ok id=${id} amount=${updateBalanceDto.amount} durationMs=${Date.now() - startedAt}`);
      return client;
    } catch (error) {
      this.logger.error(`subtractBalance:fail id=${id} amount=${updateBalanceDto?.amount} error=${error?.message}`);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to subtract balance');
    }
  }

  async getBalance(id: string) {
    try {
      const startedAt = Date.now();
      const client = await this.prisma.client.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          balance: true,
          updatedAt: true,
        },
      });

      if (!client) {
        this.logger.warn(`getBalance:not_found id=${id}`);
        throw new NotFoundException('Client not found');
      }
      this.logger.log(`getBalance:ok id=${id} durationMs=${Date.now() - startedAt}`);
      return client;
    } catch (error) {
      this.logger.error(`getBalance:fail id=${id} error=${error?.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get balance');
    }
  }
}
