import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ClientController } from '../client.controller';
import { ClientService } from '../client.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto } from '../dto';

describe('ClientController', () => {
  let controller: ClientController;
  let service: any;

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
    it('should create a client successfully', async () => {
      service.create.mockResolvedValue(mockClient);

      const result = await controller.create(createClientDto);

      expect(service.create).toHaveBeenCalledWith(createClientDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClient);
    });

    it('should propagate ConflictException when email already exists', async () => {
      const conflictError = new ConflictException('Email já está em uso');
      service.create.mockRejectedValue(conflictError);

      await expect(controller.create(createClientDto)).rejects.toThrow(conflictError);
      expect(service.create).toHaveBeenCalledWith(createClientDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when creation fails', async () => {
      const genericError = new Error('Erro ao criar cliente: Database error');
      service.create.mockRejectedValue(genericError);

      await expect(controller.create(createClientDto)).rejects.toThrow(genericError);
      expect(service.create).toHaveBeenCalledWith(createClientDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all clients without filters', async () => {
      const mockClients = [mockClient];
      service.findAll.mockResolvedValue(mockClients);

      const result = await controller.findAll(undefined);

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClients);
    });

    it('should return filtered clients when filters are provided', async () => {
      const mockClients = [mockClient];
      service.findAll.mockResolvedValue(mockClients);

      const result = await controller.findAll(filterClientDto);

      expect(service.findAll).toHaveBeenCalledWith(filterClientDto);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClients);
    });

    it('should return empty list when no clients exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll(undefined);

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should propagate generic error when search fails', async () => {
      const genericError = new Error('Erro ao buscar clientes: Database error');
      service.findAll.mockRejectedValue(genericError);

      await expect(controller.findAll(undefined)).rejects.toThrow(genericError);
      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('filterByName', () => {
    it('should filter clients by name successfully', async () => {
      const name = 'João';
      const mockClients = [mockClient];
      service.findAll.mockResolvedValue(mockClients);

      const result = await controller.filterByName(name);

      expect(service.findAll).toHaveBeenCalledWith({ name });
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClients);
    });

    it('should return empty list when no clients found with the name', async () => {
      const name = 'Maria';
      service.findAll.mockResolvedValue([]);

      const result = await controller.filterByName(name);

      expect(service.findAll).toHaveBeenCalledWith({ name });
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it('should propagate generic error when filter fails', async () => {
      const name = 'João';
      const genericError = new Error('Erro ao buscar clientes: Database error');
      service.findAll.mockRejectedValue(genericError);

      await expect(controller.filterByName(name)).rejects.toThrow(genericError);
      expect(service.findAll).toHaveBeenCalledWith({ name });
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return client found by ID', async () => {
      const clientId = 'clh1234567890abcdef';
      service.findOne.mockResolvedValue(mockClient);

      const result = await controller.findOne(clientId);

      expect(service.findOne).toHaveBeenCalledWith(clientId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockClient);
    });

    it('should propagate NotFoundException when client is not found', async () => {
      const clientId = 'clh1234567890abcdef';
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(clientId)).rejects.toThrow(notFoundError);
      expect(service.findOne).toHaveBeenCalledWith(clientId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when search fails', async () => {
      const clientId = 'clh1234567890abcdef';
      const genericError = new Error('Erro ao buscar cliente: Database error');
      service.findOne.mockRejectedValue(genericError);

      await expect(controller.findOne(clientId)).rejects.toThrow(genericError);
      expect(service.findOne).toHaveBeenCalledWith(clientId);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update existing client successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const updatedClient = { ...mockClient, ...updateClientDto };
      service.update.mockResolvedValue(updatedClient);

      const result = await controller.update(clientId, updateClientDto);

      expect(service.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedClient);
    });

    it('should propagate NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.update.mockRejectedValue(notFoundError);

      await expect(controller.update(clientId, updateClientDto)).rejects.toThrow(notFoundError);
      expect(service.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when update fails', async () => {
      const clientId = 'clh1234567890abcdef';
      const genericError = new Error('Erro ao atualizar cliente: Database error');
      service.update.mockRejectedValue(genericError);

      await expect(controller.update(clientId, updateClientDto)).rejects.toThrow(genericError);
      expect(service.update).toHaveBeenCalledWith(clientId, updateClientDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should remove existing client successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const successMessage = { message: 'Cliente removido com sucesso' };
      service.remove.mockResolvedValue(successMessage);

      const result = await controller.remove(clientId);

      expect(service.remove).toHaveBeenCalledWith(clientId);
      expect(service.remove).toHaveBeenCalledTimes(1);
      expect(result).toEqual(successMessage);
    });

    it('should propagate NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(clientId)).rejects.toThrow(notFoundError);
      expect(service.remove).toHaveBeenCalledWith(clientId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when removal fails', async () => {
      const clientId = 'clh1234567890abcdef';
      const genericError = new Error('Erro ao remover cliente: Database error');
      service.remove.mockRejectedValue(genericError);

      await expect(controller.remove(clientId)).rejects.toThrow(genericError);
      expect(service.remove).toHaveBeenCalledWith(clientId);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateProfilePicture', () => {
    it('should update profile picture successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateProfilePictureDto = {
        profilePicture: 'https://example.com/new-profile.jpg',
      };
      const updatedClient = { ...mockClient, profilePicture: updateProfilePictureDto.profilePicture };
      service.updateProfilePicture = jest.fn().mockResolvedValue(updatedClient);

      const result = await controller.updateProfilePicture(clientId, updateProfilePictureDto);

      expect(service.updateProfilePicture).toHaveBeenCalledWith(clientId, updateProfilePictureDto);
      expect(service.updateProfilePicture).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedClient);
    });

    it('should propagate NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateProfilePictureDto = {
        profilePicture: 'https://example.com/new-profile.jpg',
      };
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.updateProfilePicture = jest.fn().mockRejectedValue(notFoundError);

      await expect(controller.updateProfilePicture(clientId, updateProfilePictureDto)).rejects.toThrow(notFoundError);
      expect(service.updateProfilePicture).toHaveBeenCalledWith(clientId, updateProfilePictureDto);
      expect(service.updateProfilePicture).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when update fails', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateProfilePictureDto = {
        profilePicture: 'https://example.com/new-profile.jpg',
      };
      const genericError = new Error('Erro ao atualizar foto de perfil: Database error');
      service.updateProfilePicture = jest.fn().mockRejectedValue(genericError);

      await expect(controller.updateProfilePicture(clientId, updateProfilePictureDto)).rejects.toThrow(genericError);
      expect(service.updateProfilePicture).toHaveBeenCalledWith(clientId, updateProfilePictureDto);
      expect(service.updateProfilePicture).toHaveBeenCalledTimes(1);
    });
  });

  describe('addBalance', () => {
    it('should add balance successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateBalanceDto = { amount: 100.50 };
      const balanceResponse = { balance: 1000.50 };
      service.addBalance = jest.fn().mockResolvedValue(balanceResponse);

      const result = await controller.addBalance(clientId, updateBalanceDto);

      expect(service.addBalance).toHaveBeenCalledWith(clientId, updateBalanceDto);
      expect(service.addBalance).toHaveBeenCalledTimes(1);
      expect(result).toEqual(balanceResponse);
    });

    it('should propagate NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateBalanceDto = { amount: 100.50 };
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.addBalance = jest.fn().mockRejectedValue(notFoundError);

      await expect(controller.addBalance(clientId, updateBalanceDto)).rejects.toThrow(notFoundError);
      expect(service.addBalance).toHaveBeenCalledWith(clientId, updateBalanceDto);
      expect(service.addBalance).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when addition fails', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateBalanceDto = { amount: 100.50 };
      const genericError = new Error('Erro ao adicionar saldo: Database error');
      service.addBalance = jest.fn().mockRejectedValue(genericError);

      await expect(controller.addBalance(clientId, updateBalanceDto)).rejects.toThrow(genericError);
      expect(service.addBalance).toHaveBeenCalledWith(clientId, updateBalanceDto);
      expect(service.addBalance).toHaveBeenCalledTimes(1);
    });
  });

  describe('subtractBalance', () => {
    it('should subtract balance successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateBalanceDto = { amount: 50.25 };
      const balanceResponse = { balance: 949.75 };
      service.subtractBalance = jest.fn().mockResolvedValue(balanceResponse);

      const result = await controller.subtractBalance(clientId, updateBalanceDto);

      expect(service.subtractBalance).toHaveBeenCalledWith(clientId, updateBalanceDto);
      expect(service.subtractBalance).toHaveBeenCalledTimes(1);
      expect(result).toEqual(balanceResponse);
    });

    it('should propagate NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateBalanceDto = { amount: 50.25 };
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.subtractBalance = jest.fn().mockRejectedValue(notFoundError);

      await expect(controller.subtractBalance(clientId, updateBalanceDto)).rejects.toThrow(notFoundError);
      expect(service.subtractBalance).toHaveBeenCalledWith(clientId, updateBalanceDto);
      expect(service.subtractBalance).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when subtraction fails', async () => {
      const clientId = 'clh1234567890abcdef';
      const updateBalanceDto = { amount: 50.25 };
      const genericError = new Error('Erro ao subtrair saldo: Database error');
      service.subtractBalance = jest.fn().mockRejectedValue(genericError);

      await expect(controller.subtractBalance(clientId, updateBalanceDto)).rejects.toThrow(genericError);
      expect(service.subtractBalance).toHaveBeenCalledWith(clientId, updateBalanceDto);
      expect(service.subtractBalance).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBalance', () => {
    it('should return client balance successfully', async () => {
      const clientId = 'clh1234567890abcdef';
      const balanceResponse = { balance: 1000.00 };
      service.getBalance = jest.fn().mockResolvedValue(balanceResponse);

      const result = await controller.getBalance(clientId);

      expect(service.getBalance).toHaveBeenCalledWith(clientId);
      expect(service.getBalance).toHaveBeenCalledTimes(1);
      expect(result).toEqual(balanceResponse);
    });

    it('should propagate NotFoundException when client does not exist', async () => {
      const clientId = 'clh1234567890abcdef';
      const notFoundError = new NotFoundException('Cliente não encontrado');
      service.getBalance = jest.fn().mockRejectedValue(notFoundError);

      await expect(controller.getBalance(clientId)).rejects.toThrow(notFoundError);
      expect(service.getBalance).toHaveBeenCalledWith(clientId);
      expect(service.getBalance).toHaveBeenCalledTimes(1);
    });

    it('should propagate generic error when query fails', async () => {
      const clientId = 'clh1234567890abcdef';
      const genericError = new Error('Erro ao consultar saldo: Database error');
      service.getBalance = jest.fn().mockRejectedValue(genericError);

      await expect(controller.getBalance(clientId)).rejects.toThrow(genericError);
      expect(service.getBalance).toHaveBeenCalledWith(clientId);
      expect(service.getBalance).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('should execute complete CRUD flow', async () => {
      const clientId = 'clh1234567890abcdef';
      service.create.mockResolvedValue(mockClient);
      service.findAll.mockResolvedValue([mockClient]);
      service.findOne.mockResolvedValue(mockClient);
      service.update.mockResolvedValue({ ...mockClient, name: 'João Silva Santos' });
      service.remove.mockResolvedValue({ message: 'Cliente removido com sucesso' });

      const createdClient = await controller.create(createClientDto);
      expect(createdClient).toEqual(mockClient);

      const allClients = await controller.findAll(undefined);
      expect(allClients).toEqual([mockClient]);

      const foundClient = await controller.findOne(clientId);
      expect(foundClient).toEqual(mockClient);

      const updatedClient = await controller.update(clientId, updateClientDto);
      expect(updatedClient.name).toBe('João Silva Santos');

      const removeResult = await controller.remove(clientId);
      expect(removeResult).toEqual({ message: 'Cliente removido com sucesso' });

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });
});