import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { RegisterDto, LoginDto } from '../dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;

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

  const registerDto: RegisterDto = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
  };

  const loginDto: LoginDto = {
    email: 'joao@example.com',
    password: 'senha123',
  };

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
    const mockPrismaService = {
      client: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

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
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a client successfully', async () => {
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockResolvedValue(mockClient);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.register(registerDto);

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

    it('should throw ConflictException when email already exists', async () => {
      prismaService.client.findUnique.mockResolvedValue(mockClient);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email já está em uso'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(mockedBcrypt.hash).not.toHaveBeenCalled();
      expect(prismaService.client.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when creation fails', async () => {
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'Erro ao registrar cliente: Database error',
      );
    });

    it('should throw generic error when email verification fails', async () => {
      prismaService.client.findUnique.mockRejectedValue(new Error('Database connection error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'Erro ao registrar cliente: Database connection error',
      );
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto);

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

    it('should throw UnauthorizedException when client does not exist', async () => {
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciais inválidas'),
      );
      expect(prismaService.client.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockClient.password);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when client search fails', async () => {
      prismaService.client.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.login(loginDto)).rejects.toThrow(
        'Erro ao fazer login: Database error',
      );
    });

    it('should throw generic error when password verification fails', async () => {
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      (mockedBcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(service.login(loginDto)).rejects.toThrow(
        'Erro ao fazer login: Bcrypt error',
      );
    });
  });

  describe('validateUser', () => {
    const mockUser = {
      id: mockClient.id,
      name: mockClient.name,
      email: mockClient.email,
      bankingAgency: mockClient.bankingAgency,
      bankingAccount: mockClient.bankingAccount,
    };

    it('should validate user successfully', async () => {
      prismaService.client.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockClient.id);

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

    it('should throw UnauthorizedException when user does not exist', async () => {
      prismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('non-existent-id')).rejects.toThrow(
        new UnauthorizedException('Usuário não encontrado'),
      );
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

    it('should throw InternalServerErrorException when search fails', async () => {
      prismaService.client.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.validateUser(mockClient.id)).rejects.toThrow(
        'Erro ao validar usuário: Database error',
      );
    });

    it('should throw generic error when validation fails', async () => {
      prismaService.client.findUnique.mockRejectedValue(new Error('Connection timeout'));

      await expect(service.validateUser(mockClient.id)).rejects.toThrow(
        'Erro ao validar usuário: Connection timeout',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle invalid email format in registration', async () => {
      const invalidEmailDto = { ...registerDto, email: 'invalid-email' };
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
      prismaService.client.create.mockRejectedValue(new Error('Invalid email format'));

      await expect(service.register(invalidEmailDto)).rejects.toThrow(
        'Erro ao registrar cliente: Invalid email format',
      );
    });

    it('should handle short password in registration', async () => {
      const shortPasswordDto = { ...registerDto, password: '123' };
      prismaService.client.findUnique.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockRejectedValue(new Error('Password too short'));

      await expect(service.register(shortPasswordDto)).rejects.toThrow(
        'Erro ao registrar cliente: Password too short',
      );
    });

    it('should handle invalid JWT token in login', async () => {
      prismaService.client.findUnique.mockResolvedValue(mockClient);
      (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT signing failed');
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        'Erro ao fazer login: JWT signing failed',
      );
    });

    it('should handle corrupted user data in validation', async () => {
      const corruptedUser = {
        id: null,
        name: mockClient.name,
        email: mockClient.email,
        bankingAgency: mockClient.bankingAgency,
        bankingAccount: mockClient.bankingAccount,
      };
      prismaService.client.findUnique.mockResolvedValue(corruptedUser);

      const result = await service.validateUser(mockClient.id);

      expect(result).toEqual(corruptedUser);
    });
  });
});