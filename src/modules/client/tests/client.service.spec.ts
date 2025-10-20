import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ClientService } from '../client.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto, UpdateProfilePictureDto, UpdateBalanceDto } from '../dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('ClientService', () => {
  let service: ClientService;
  let prismaService: any;
  let redisService: any;
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
    balance: 1000.50,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockClientForCreate = {
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

  const updateProfilePictureDto: UpdateProfilePictureDto = {
    profilePicture: 'https://example.com/new-profile.jpg',
  };

  const updateBalanceDto: UpdateBalanceDto = {
    amount: 100.50,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      client: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a client successfully', async () => {
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockResolvedValue(mockClientForCreate);

      const result = await service.create(createClientDto);

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

    it('should throw ConflictException when email already exists', async () => {
      prismaService.client.findUnique.mockResolvedValue(mockClient);

      await expect(service.create(createClientDto)).rejects.toThrow(
        new ConflictException('Email already in use'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: createClientDto.email },
      });
      expect(prismaService.client.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when creation fails', async () => {
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createClientDto)).rejects.toThrow(
        new InternalServerErrorException('Failed to create client'),
      );
    });
  });

  describe('findAll', () => {
    it('should return all clients without filters', async () => {
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      const result = await service.findAll();

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

    it('should filter clients by name', async () => {
      const filterDto: FilterClientDto = { name: 'João' };
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      const result = await service.findAll(filterDto);

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

    it('should filter clients by email', async () => {
      const filterDto: FilterClientDto = { email: 'joao@example.com' };
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      const result = await service.findAll(filterDto);

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

    it('should filter clients by name and email', async () => {
      const filterDto: FilterClientDto = { name: 'João', email: 'joao@example.com' };
      const mockClients = [mockClientWithoutPassword];
      prismaService.client.findMany.mockResolvedValue(mockClients);

      const result = await service.findAll(filterDto);

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

    it('should throw InternalServerErrorException when search fails', async () => {
      prismaService.client.findMany.mockRejectedValue(new Error('Database error'));

      await expect(service.findAll()).rejects.toThrow(
        new InternalServerErrorException('Failed to fetch clients'),
      );
    });
  });

  describe('findOne', () => {
    it('should return client from cache when available', async () => {
      const clientId = 'clh1234567890abcdef';
      const cachedClient = JSON.stringify(mockClientWithoutPassword);
      redisService.get.mockResolvedValue(cachedClient);

      const result = await service.findOne(clientId);

      expect(redisService.get).toHaveBeenCalledWith(`client:${clientId}`);
      expect(prismaService.client.findUnique).not.toHaveBeenCalled();
      expect(result.id).toBe(mockClientWithoutPassword.id);
      expect(result.name).toBe(mockClientWithoutPassword.name);
      expect(result.email).toBe(mockClientWithoutPassword.email);
      expect(result.phone).toBe(mockClientWithoutPassword.phone);
      expect(result.address).toBe(mockClientWithoutPassword.address);
      expect(result.bankingAgency).toBe(mockClientWithoutPassword.bankingAgency);
      expect(result.bankingAccount).toBe(mockClientWithoutPassword.bankingAccount);
      expect(result.profilePicture).toBe(mockClientWithoutPassword.profilePicture);
    });

    it('should fetch client from database when not in cache', async () => {
      const clientId = 'clh1234567890abcdef';
      redisService.get.mockResolvedValue(null);
      prismaService.client.findUnique.mockResolvedValue(mockClientWithoutPassword);
      redisService.set.mockResolvedValue(true);

      const result = await service.findOne(clientId);

      expect(redisService.get).toHaveBeenCalledWith(`client:${clientId}`);
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
      expect(redisService.set).toHaveBeenCalledWith(
        `client:${clientId}`,
        JSON.stringify(mockClientWithoutPassword),
        300,
      );
      expect(result).toEqual(mockClientWithoutPassword);
    });

    it('should throw NotFoundException when client is not found', async () => {
      const clientId = 'clh1234567890abcdef';
      redisService.get.mockResolvedValue(null);
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.findOne(clientId)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
      expect(redisService.get).toHaveBeenCalledWith(`client:${clientId}`);
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

    it('should throw InternalServerErrorException when search fails', async () => {
      const clientId = 'clh1234567890abcdef';
      redisService.get.mockResolvedValue(null);
      prismaService.client.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.findOne(clientId)).rejects.toThrow(
        new InternalServerErrorException('Failed to fetch client'),
      );
    });
  });

  describe('update', () => {
    it('should update existing client successfully and invalidate cache', async () => {
      const clientId = 'clh1234567890abcdef';
      const updatedClient = { ...mockClientWithoutPassword, ...updateClientDto };
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockResolvedValue(updatedClient);
      redisService.del.mockResolvedValue(true);

      const result = await service.update(clientId, updateClientDto);

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
      expect(redisService.del).toHaveBeenCalledWith(`client:${clientId}`);
      expect(result).toEqual(updatedClient);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.update(clientId, updateClientDto)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.update).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockRejectedValue(new Error('Database error'));

      await expect(service.update(clientId, updateClientDto)).rejects.toThrow(
        new InternalServerErrorException('Failed to update client'),
      );
    });
  });

  describe('remove', () => {
    it('should remove existing client successfully and invalidate cache', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.delete.mockResolvedValue(mockClient);
      redisService.del.mockResolvedValue(true);

      const result = await service.remove(clientId);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.delete).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(redisService.del).toHaveBeenCalledWith(`client:${clientId}`);
      expect(result).toEqual({ message: 'Cliente removido com sucesso' });
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.remove(clientId)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.delete).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when removal fails', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.delete.mockRejectedValue(new Error('Database error'));

      await expect(service.remove(clientId)).rejects.toThrow(
        new InternalServerErrorException('Failed to delete client'),
      );
    });
  });

  describe('updateProfilePicture', () => {
    it('should update profile picture successfully and invalidate cache', async () => {
      const clientId = 'clh1234567890abcdef';
      const updatedClient = {
        id: clientId,
        name: 'João Silva',
        profilePicture: 'https://example.com/new-profile.jpg',
        updatedAt: new Date(),
      };
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockResolvedValue(updatedClient);
      redisService.del.mockResolvedValue(true);

      const result = await service.updateProfilePicture(clientId, updateProfilePictureDto);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: {
          profilePicture: 'https://example.com/new-profile.jpg',
        },
        select: {
          id: true,
          name: true,
          profilePicture: true,
          updatedAt: true,
        },
      });
      expect(redisService.del).toHaveBeenCalledWith(`client:${clientId}`);
      expect(result).toEqual(updatedClient);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.updateProfilePicture(clientId, updateProfilePictureDto)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
    });

    it('should throw ConflictException when picture is the same', async () => {
      const clientId = 'clh1234567890abcdef';
      const clientWithSamePicture = { ...mockClient, profilePicture: 'https://example.com/new-profile.jpg' };
      prismaService.client.findUnique.mockResolvedValue(clientWithSamePicture);

      await expect(service.updateProfilePicture(clientId, updateProfilePictureDto)).rejects.toThrow(
        new ConflictException('Profile picture is the same'),
      );
    });

    it('should throw BadRequestException when URL contains suspicious content', async () => {
      const clientId = 'clh1234567890abcdef';
      const suspiciousDto = { profilePicture: 'https://example.com/<script>alert("xss")</script>' };
      prismaService.client.findUnique.mockResolvedValue(mockClient);

      await expect(service.updateProfilePicture(clientId, suspiciousDto)).rejects.toThrow(
        new BadRequestException('URL contains suspicious content'),
      );
    });

    it('should throw BadRequestException when URL is too long', async () => {
      const clientId = 'clh1234567890abcdef';
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      const longUrlDto = { profilePicture: longUrl };
      prismaService.client.findUnique.mockResolvedValue(mockClient);

      await expect(service.updateProfilePicture(clientId, longUrlDto)).rejects.toThrow(
        new BadRequestException('URL too long'),
      );
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockRejectedValue(new Error('Database error'));

      await expect(service.updateProfilePicture(clientId, updateProfilePictureDto)).rejects.toThrow(
        new InternalServerErrorException('Failed to update profile picture'),
      );
    });
  });

  describe('addBalance', () => {
    it('should add balance successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const updatedClient = {
        id: clientId,
        name: 'João Silva',
        balance: 1100.50,
        updatedAt: new Date(),
      };
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockResolvedValue(updatedClient);

      const result = await service.addBalance(clientId, updateBalanceDto);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: {
          balance: {
            increment: 100.50,
          },
        },
        select: {
          id: true,
          name: true,
          balance: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedClient);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.addBalance(clientId, updateBalanceDto)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockRejectedValue(new Error('Database error'));

      await expect(service.addBalance(clientId, updateBalanceDto)).rejects.toThrow(
        new InternalServerErrorException('Failed to add balance'),
      );
    });
  });

  describe('subtractBalance', () => {
    it('should subtract balance successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const updatedClient = {
        id: clientId,
        name: 'João Silva',
        balance: 900.00,
        updatedAt: new Date(),
      };
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockResolvedValue(updatedClient);

      const result = await service.subtractBalance(clientId, updateBalanceDto);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
      });
      expect(prismaService.client.update).toHaveBeenCalledWith({
        where: { id: clientId },
        data: {
          balance: {
            decrement: 100.50,
          },
        },
        select: {
          id: true,
          name: true,
          balance: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedClient);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.subtractBalance(clientId, updateBalanceDto)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
    });

    it('should throw BadRequestException when balance is insufficient', async () => {
      const clientId = 'clh1234567890abcdef';
      const clientWithLowBalance = { ...mockClient, balance: 50.00 };
      prismaService.client.findUnique.mockResolvedValue(clientWithLowBalance);

      await expect(service.subtractBalance(clientId, updateBalanceDto)).rejects.toThrow(
        new BadRequestException('Insufficient balance'),
      );
    });

    it('should throw InternalServerErrorException when update fails', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      prismaService.client.update.mockRejectedValue(new Error('Database error'));

      await expect(service.subtractBalance(clientId, updateBalanceDto)).rejects.toThrow(
        new InternalServerErrorException('Failed to subtract balance'),
      );
    });
  });

  describe('getBalance', () => {
    it('should return client balance successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const clientBalance = {
        id: clientId,
        name: 'João Silva',
        balance: 1000.50,
        updatedAt: new Date(),
      };
      prismaService.client.findUnique.mockResolvedValue(clientBalance);

      const result = await service.getBalance(clientId);

      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          balance: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(clientBalance);
    });

    it('should throw NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.getBalance(clientId)).rejects.toThrow(
        new NotFoundException('Client not found'),
      );
    });

    it('should throw InternalServerErrorException when search fails', async () => {
      const clientId = 'clh1234567890abcdef';
      prismaService.client.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.getBalance(clientId)).rejects.toThrow(
        new InternalServerErrorException('Failed to get balance'),
      );
    });
  });
});