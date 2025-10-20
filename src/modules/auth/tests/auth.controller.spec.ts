import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockAuthResponse: AuthResponseDto = {
    access_token: 'jwt-token-123',
    user: {
      id: 'clh1234567890abcdef',
      name: 'João Silva',
      email: 'joao@example.com',
      bankingAgency: '1234',
      bankingAccount: '56789-0',
    },
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

  const mockUser = {
    id: 'clh1234567890abcdef',
    name: 'João Silva',
    email: 'joao@example.com',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a client successfully', async () => {
      service.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw ConflictException when email already exists', async () => {
      const conflictError = new ConflictException('Email já está em uso');
      service.register.mockRejectedValue(conflictError);

      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(controller.register(registerDto)).rejects.toThrow('Email já está em uso');
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw generic error when service fails', async () => {
      const genericError = new Error('Erro ao registrar cliente: Database error');
      service.register.mockRejectedValue(genericError);

      await expect(controller.register(registerDto)).rejects.toThrow(genericError);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      service.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const unauthorizedError = new UnauthorizedException('Credenciais inválidas');
      service.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Credenciais inválidas');
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw generic error when service fails', async () => {
      const genericError = new Error('Erro ao fazer login: Database error');
      service.login.mockRejectedValue(genericError);

      await expect(controller.login(loginDto)).rejects.toThrow(genericError);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('getProfile', () => {
    it('should return authenticated user profile', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUser);
    });

    it('should return undefined when user is not authenticated', async () => {
      const mockRequest = {
        user: undefined,
      };

      const result = await controller.getProfile(mockRequest);

      expect(result).toBeUndefined();
    });

    it('should return null when user is null', async () => {
      const mockRequest = {
        user: null,
      };

      const result = await controller.getProfile(mockRequest);

      expect(result).toBeNull();
    });
  });

  describe('validate', () => {
    it('should validate user successfully', async () => {
      const mockRequest = {
        user: mockUser,
      };

      const result = await controller.validate(mockRequest);

      expect(result).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        isValid: true,
      });
    });

    it('should throw error when user is undefined', async () => {
      const mockRequest = {
        user: undefined,
      };

      await expect(controller.validate(mockRequest)).rejects.toThrow('Cannot read properties of undefined (reading \'id\')');
    });

    it('should throw error when user is null', async () => {
      const mockRequest = {
        user: null,
      };

      await expect(controller.validate(mockRequest)).rejects.toThrow('Cannot read properties of null (reading \'id\')');
    });

    it('should return correct information for authenticated user', async () => {
      const mockRequest = {
        user: {
          id: 'clh1234567890abcdef',
          email: 'joao@example.com',
          name: 'João Silva',
        },
      };

      const result = await controller.validate(mockRequest);

      expect(result).toEqual({
        userId: 'clh1234567890abcdef',
        email: 'joao@example.com',
        isValid: true,
      });
    });
  });
});
