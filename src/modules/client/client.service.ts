import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClientDto: CreateClientDto) {
    try {
      // Verificar se email já existe
      const existingClient = await this.prisma.client.findUnique({
        where: { email: createClientDto.email },
      });

      if (existingClient) {
        throw new ConflictException('Email já está em uso');
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
      return clientWithoutPassword;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Erro ao criar cliente: ' + error.message);
    }
  }

  async findAll(filterDto?: FilterClientDto) {
    try {
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

      return clients;
    } catch (error) {
      throw new Error('Erro ao buscar clientes: ' + error.message);
    }
  }

  async findOne(id: string) {
    try {
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
        throw new NotFoundException('Cliente não encontrado');
      }

      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Erro ao buscar cliente: ' + error.message);
    }
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException('Cliente não encontrado');
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

      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Erro ao atualizar cliente: ' + error.message);
    }
  }

  async remove(id: string) {
    try {
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException('Cliente não encontrado');
      }

      await this.prisma.client.delete({
        where: { id },
      });

      return { message: 'Cliente removido com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Erro ao remover cliente: ' + error.message);
    }
  }
}
