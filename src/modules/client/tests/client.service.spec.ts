import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ClientService } from '../client.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto } from '../dto';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('ClientService', () => {
  let service: ClientService;
  let prismaService: any;

  // Dados de teste (fixtures)
  const mockClient = {
    id: 'clh1234567890abcdef',
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'hashedPassword123',
    phone: '+5511999999999',
    address: 'Rua das Flores, 123',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
    profilePicture: 'https://example.com/profile.jpg',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockClientWithoutPassword = {
    id: 'clh1234567890abcdef',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '+5511999999999',
    address: 'Rua das Flores, 123',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
    profilePicture: 'https://example.com/profile.jpg',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const createClientDto: CreateClientDto = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123',
    phone: '+5511999999999',
    address: 'Rua das Flores, 123',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
    profilePicture: 'https://example.com/profile.jpg',
  };

  const updateClientDto: UpdateClientDto = {
    name: 'João Silva Santos',
    phone: '+5511888888888',
    address: 'Rua das Palmeiras, 456',
  };

  beforeEach(async () => {
    // Mock do PrismaService
    const mockPrismaService = {
      client: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um cliente com sucesso', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockResolvedValue(mockClient);

      // Act
      const result = await service.create(createClientDto);

      // Assert
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: createClientDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(createClientDto.password, 10);
      expect(prismaService.client.create).toHaveBeenCalledWith({
        data: {
          ...createClientDto,
          password: 'hashedPassword123',
        },
      });
      expect(result).toEqual(mockClientWithoutPassword);
    });

    it('deve lançar ConflictException quando email já existe', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(mockClient);

      // Act & Assert
      await expect(service.create(createClientDto)).rejects.toThrow(
        new ConflictException('Email já está em uso'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: createClientDto.email },
      });
      expect(prismaService.client.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro genérico quando falha na criação', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.create(createClientDto)).rejects.toThrow(
        'Erro ao criar cliente: Database error',
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os clientes sem filtros', async () => {
      // Arrange
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      // Act
      const result = await service.findAll();

      // Assert
      expect(prismaService.client.findMany).toHaveBeenCalledWith({
        where: {},
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
      expect(result).toEqual(mockClients);
    });

    it('deve filtrar clientes por nome', async () => {
      // Arrange
      const filterDto: FilterClientDto = { name: 'João' };
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(prismaService.client.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'João',
            mode: 'insensitive',
          },
        },
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
      expect(result).toEqual(mockClients);
    });

    it('deve filtrar clientes por email', async () => {
      // Arrange
      const filterDto: FilterClientDto = { email: 'joao@example.com' };
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(prismaService.client.findMany).toHaveBeenCalledWith({
        where: {
          email: {
            contains: 'joao@example.com',
            mode: 'insensitive',
          },
        },
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
      expect(result).toEqual(mockClients);
    });

    it('deve filtrar clientes por nome e email', async () => {
      // Arrange
      const filterDto: FilterClientDto = { name: 'João', email: 'joao@example.com' };
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      // Act
      const result = await service.findAll(filterDto);

      // Assert
      expect(prismaService.client.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'João',
            mode: 'insensitive',
          },
          email: {
            contains: 'joao@example.com',
            mode: 'insensitive',
          },
        },
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
      expect(result).toEqual(mockClients);
    });

    it('deve lançar erro genérico quando falha na busca', async () => {
      // Arrange
      prismaService.client.findMany.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(
        'Erro ao buscar clientes: Database error',
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar cliente encontrado por ID', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClientWithoutPassword);

      // Act
      const result = await service.findOne(clientId);

      // Assert
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
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
      expect(result).toEqual(mockClientWithoutPassword);
    });

    it('deve lançar NotFoundException quando cliente não é encontrado', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(clientId)).rejects.toThrow(
        new NotFoundException('Cliente não encontrado'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
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
    });

    it('deve lançar erro genérico quando falha na busca', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.findOne(clientId)).rejects.toThrow(
        'Erro ao buscar cliente: Database error',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar cliente existente com sucesso', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const updatedClient = { ...mockClient, ...updateClientDto };
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockResolvedValue(updatedClient);

      // Act
      const result = await service.update(clientId, updateClientDto);

      // Assert
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
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
      expect(result).toEqual(updatedClient);
    });

    it('deve lançar NotFoundException quando cliente não existe', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(clientId, updateClientDto)).rejects.toThrow(
        new NotFoundException('Cliente não encontrado'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.update).not.toHaveBeenCalled();
    });

    it('deve lançar erro genérico quando falha na atualização', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.update(clientId, updateClientDto)).rejects.toThrow(
        'Erro ao atualizar cliente: Database error',
      );
    });
  });

  describe('remove', () => {
    it('deve remover cliente existente com sucesso', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.delete.mockResolvedValue(mockClient);

      // Act
      const result = await service.remove(clientId);

      // Assert
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.delete).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(result).toEqual({ message: 'Cliente removido com sucesso' });
    });

    it('deve lançar NotFoundException quando cliente não existe', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(clientId)).rejects.toThrow(
        new NotFoundException('Cliente não encontrado'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.delete).not.toHaveBeenCalled();
    });

    it('deve lançar erro genérico quando falha na remoção', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.delete.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.remove(clientId)).rejects.toThrow(
        'Erro ao remover cliente: Database error',
      );
    });
  });
});