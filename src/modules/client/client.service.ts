import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto, UpdateProfilePictureDto, UpdateBalanceDto } from './dto';
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

  async updateProfilePicture(id: string, updateProfilePictureDto: UpdateProfilePictureDto) {
    try {
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException('Cliente não encontrado');
      }

      // Validações extras de segurança
      const { profilePicture } = updateProfilePictureDto;
      
      // Verificar se a URL não é a mesma atual (evitar updates desnecessários)
      if (existingClient.profilePicture === profilePicture) {
        throw new ConflictException('A foto de perfil já é a mesma');
      }

      // Verificar se a URL não contém caracteres suspeitos
      if (profilePicture.includes('<script>') || profilePicture.includes('javascript:')) {
        throw new BadRequestException('URL contém conteúdo suspeito');
      }

      // Verificar se a URL não é muito longa (proteção contra DoS)
      if (profilePicture.length > 500) {
        throw new BadRequestException('URL muito longa');
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

      return client;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Erro ao atualizar foto de perfil: ' + error.message);
    }
  }

  async addBalance(id: string, updateBalanceDto: UpdateBalanceDto) {
    try {
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException('Cliente não encontrado');
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

      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Erro ao adicionar saldo: ' + error.message);
    }
  }

  async subtractBalance(id: string, updateBalanceDto: UpdateBalanceDto) {
    try {
      // Verificar se cliente existe
      const existingClient = await this.prisma.client.findUnique({
        where: { id },
      });

      if (!existingClient) {
        throw new NotFoundException('Cliente não encontrado');
      }

      // Verificar se tem saldo suficiente
      if (existingClient.balance < updateBalanceDto.amount) {
        throw new BadRequestException('Saldo insuficiente');
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

      return client;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new Error('Erro ao subtrair saldo: ' + error.message);
    }
  }

  async getBalance(id: string) {
    try {
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
        throw new NotFoundException('Cliente não encontrado');
      }

      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Erro ao consultar saldo: ' + error.message);
    }
  }
}
