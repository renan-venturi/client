import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RegisterDto, LoginDto } from '../dto';
import * as bcrypt from 'bcrypt';

// Mock do bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let mockedBcrypt: jest.Mocked<typeof bcrypt>;

  // Dados de mock para um cliente
  const mockClient = {
    id: 'clh1234567890abcdef',
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'hashedPassword123',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  // Dados de mock para registro
  const registerDto: RegisterDto = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
  };

  // Dados de mock para login
  const loginDto: LoginDto = {
    email: 'joao@example.com',
    password: 'senha123',
  };

  // Mock de resposta de autenticação
  const mockAuthResponse = {
    access_token: 'jwt-token-123',
    user: {
      id: mockClient.id,
      name: mockClient.name,
      email: mockClient.email,
      bankingAgency: mockClient.bankingAgency,
      bankingAccount: mockClient.bankingAccount,
    },
  };

  beforeEach(async () => {
    // Mock do PrismaService
    const mockPrismaService = {
      client: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    // Mock do JwtService
    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Testes para o método register
  describe('register', () => {
    it('deve registrar um cliente com sucesso', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockResolvedValue(mockClient);
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(prismaService.client.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password: 'hashedPassword123',
          bankingAgency: registerDto.bankingAgency,
          bankingAccount: registerDto.bankingAccount,
        },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockClient.id,
        email: mockClient.email,
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve lançar ConflictException quando email já existe', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(mockClient);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow('Email já está em uso');
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(prismaService.client.create).not.toHaveBeenCalled();
    });

    it('deve lançar erro genérico quando falha na criação', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow('Erro ao registrar cliente: Database error');
      expect(prismaService.client.findUnique).toHaveBeenCalledTimes(1);
      expect(mockedBcrypt.hash).toHaveBeenCalledTimes(1);
      expect(prismaService.client.create).toHaveBeenCalledTimes(1);
    });
  });

  // Testes para o método login
  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockClient.password);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockClient.id,
        email: mockClient.email,
      });
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve lançar UnauthorizedException quando cliente não existe', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Credenciais inválidas');
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar UnauthorizedException quando senha está incorreta', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Credenciais inválidas');
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockClient.password);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve lançar erro genérico quando falha na operação', async () => {
      // Arrange
      prismaService.client.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow('Erro ao fazer login: Database error');
      expect(prismaService.client.findUnique).toHaveBeenCalledTimes(1);
    });
  });

  // Testes para o método validateUser
  describe('validateUser', () => {
    const mockUser = {
      id: mockClient.id,
      name: mockClient.name,
      email: mockClient.email,
      bankingAgency: mockClient.bankingAgency,
      bankingAccount: mockClient.bankingAccount,
    };

    it('deve validar usuário com sucesso', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(mockClient.id);

      // Assert
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: mockClient.id },
        select: {
          id: true,
          name: true,
          email: true,
          bankingAgency: true,
          bankingAccount: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('deve lançar UnauthorizedException quando usuário não existe', async () => {
      // Arrange
      prismaService.client.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.validateUser('non-existent-id')).rejects.toThrow(UnauthorizedException);
      await expect(service.validateUser('non-existent-id')).rejects.toThrow('Usuário não encontrado');
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        select: {
          id: true,
          name: true,
          email: true,
          bankingAgency: true,
          bankingAccount: true,
        },
      });
    });

    it('deve lançar erro genérico quando falha na validação', async () => {
      // Arrange
      prismaService.client.findUnique.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(service.validateUser(mockClient.id)).rejects.toThrow('Erro ao validar usuário: Database error');
      expect(prismaService.client.findUnique).toHaveBeenCalledTimes(1);
    });
  });
});
