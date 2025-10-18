import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ClientController } from '../client.controller';
import { ClientService } from '../client.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto } from '../dto';

describe('ClientController', () => {
  let controller: ClientController;
  let service: any;

  // Dados de teste (fixtures)
  const mockClient = {
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

  const filterClientDto: FilterClientDto = {
    name: 'João',
    email: 'joao@example.com',
  };

  beforeEach(async () => {
    // Mock do ClientService
    const mockClientService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: mockClientService,
        },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    service = module.get(ClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um cliente com sucesso', async () => {
      // Arrange
      service.create.mockResolvedValue(mockClient);

      // Act
      const result = await controller.create(createClientDto);

      // Assert
      expect(service.create).toHaveBeenCalledWith(createClientDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClient);
    });

    it('deve propagar ConflictException quando email já existe', async () => {
      // Arrange
      const conflictError = new ConflictException('Email já está em uso');
      service.create.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.create(createClientDto)).rejects.toThrow(conflictError);
      expect(service.create).toHaveBeenCalledWith(createClientDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro genérico quando falha na criação', async () => {
      // Arrange
      const genericError = new Error('Erro ao criar cliente: Database error');
      service.create.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.create(createClientDto)).rejects.toThrow(genericError);
      expect(service.create).toHaveBeenCalledWith(createClientDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('deve retornar todos os clientes sem filtros', async () => {
      // Arrange
      const mockClients = [mockClient];
      service.findAll.mockResolvedValue(mockClients);

      // Act
      const result = await controller.findAll(undefined);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClients);
    });

    it('deve retornar clientes filtrados quando filtros são fornecidos', async () => {
      // Arrange
      const mockClients = [mockClient];
      service.findAll.mockResolvedValue(mockClients);

      // Act
      const result = await controller.findAll(filterClientDto);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(filterClientDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClients);
    });

    it('deve retornar lista vazia quando não há clientes', async () => {
      // Arrange
      service.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.findAll(undefined);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('deve propagar erro genérico quando falha na busca', async () => {
      // Arrange
      const genericError = new Error('Erro ao buscar clientes: Database error');
      service.findAll.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.findAll(undefined)).rejects.toThrow(genericError);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('filterByName', () => {
    it('deve filtrar clientes por nome com sucesso', async () => {
      // Arrange
      const name = 'João';
      const mockClients = [mockClient];
      service.findAll.mockResolvedValue(mockClients);

      // Act
      const result = await controller.filterByName(name);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({ name });
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClients);
    });

    it('deve retornar lista vazia quando não encontra clientes com o nome', async () => {
      // Arrange
      const name = 'Maria';
      service.findAll.mockResolvedValue([]);

      // Act
      const result = await controller.filterByName(name);

      // Assert
      expect(service.findAll).toHaveBeenCalledWith({ name });
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('deve propagar erro genérico quando falha no filtro', async () => {
      // Arrange
      const name = 'João';
      const genericError = new Error('Erro ao buscar clientes: Database error');
      service.findAll.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.filterByName(name)).rejects.toThrow(genericError);
      expect(service.findAll).toHaveBeenCalledWith({ name });
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('deve retornar cliente encontrado por ID', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      service.findOne.mockResolvedValue(mockClient);

      // Act
      const result = await controller.findOne(clientId);

      // Assert
      expect(service.findOne).toHaveBeenCalledWith(clientId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClient);
    });

    it('deve propagar NotFoundException quando cliente não é encontrado', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.findOne.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.findOne(clientId)).rejects.toThrow(notFoundError);
      expect(service.findOne).toHaveBeenCalledWith(clientId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro genérico quando falha na busca', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const genericError = new Error('Erro ao buscar cliente: Database error');
      service.findOne.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.findOne(clientId)).rejects.toThrow(genericError);
      expect(service.findOne).toHaveBeenCalledWith(clientId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('deve atualizar cliente existente com sucesso', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const updatedClient = { ...mockClient, ...updateClientDto };
      service.update.mockResolvedValue(updatedClient);

      // Act
      const result = await controller.update(clientId, updateClientDto);

      // Assert
      expect(service.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedClient);
    });

    it('deve propagar NotFoundException quando cliente não existe', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.update(clientId, updateClientDto)).rejects.toThrow(notFoundError);
      expect(service.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro genérico quando falha na atualização', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const genericError = new Error('Erro ao atualizar cliente: Database error');
      service.update.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.update(clientId, updateClientDto)).rejects.toThrow(genericError);
      expect(service.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('deve remover cliente existente com sucesso', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const successMessage = { message: 'Cliente removido com sucesso' };
      service.remove.mockResolvedValue(successMessage);

      // Act
      const result = await controller.remove(clientId);

      // Assert
      expect(service.remove).toHaveBeenCalledWith(clientId);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(result).toEqual(successMessage);
    });

    it('deve propagar NotFoundException quando cliente não existe', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.remove.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(controller.remove(clientId)).rejects.toThrow(notFoundError);
      expect(service.remove).toHaveBeenCalledWith(clientId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro genérico quando falha na remoção', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      const genericError = new Error('Erro ao remover cliente: Database error');
      service.remove.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.remove(clientId)).rejects.toThrow(genericError);
      expect(service.remove).toHaveBeenCalledWith(clientId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('deve executar fluxo completo de CRUD', async () => {
      // Arrange
      const clientId = 'clh1234567890abcdef';
      service.create.mockResolvedValue(mockClient);
      service.findAll.mockResolvedValue([mockClient]);
      service.findOne.mockResolvedValue(mockClient);
      service.update.mockResolvedValue({ ...mockClient, name: 'João Silva Santos' });
      service.remove.mockResolvedValue({ message: 'Cliente removido com sucesso' });

      // Act & Assert - Create
      const createdClient = await controller.create(createClientDto);
      expect(createdClient).toEqual(mockClient);

      // Act & Assert - Find All
      const allClients = await controller.findAll(undefined);
      expect(allClients).toEqual([mockClient]);

      // Act & Assert - Find One
      const foundClient = await controller.findOne(clientId);
      expect(foundClient).toEqual(mockClient);

      // Act & Assert - Update
      const updatedClient = await controller.update(clientId, updateClientDto);
      expect(updatedClient.name).toBe('João Silva Santos');

      // Act & Assert - Remove
      const removeResult = await controller.remove(clientId);
      expect(removeResult).toEqual({ message: 'Cliente removido com sucesso' });

      // Verify all methods were called
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});