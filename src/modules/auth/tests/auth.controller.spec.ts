import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  // Mock de resposta de autenticação
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

  // Mock de dados para registro
  const registerDto: RegisterDto = {
    name: 'João Silva',
    email: 'joao@example.com',
    password: 'senha123',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
  };

  // Mock de dados para login
  const loginDto: LoginDto = {
    email: 'joao@example.com',
    password: 'senha123',
  };

  // Mock de usuário autenticado
  const mockUser = {
    id: 'clh1234567890abcdef',
    name: 'João Silva',
    email: 'joao@example.com',
    bankingAgency: '1234',
    bankingAccount: '56789-0',
  };

  beforeEach(async () => {
    // Mock do AuthService
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

  // Testes para o método register
  describe('register', () => {
    it('deve registrar um cliente com sucesso', async () => {
      // Arrange
      service.register.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve lançar ConflictException quando email já existe', async () => {
      // Arrange
      const conflictError = new ConflictException('Email já está em uso');
      service.register.mockRejectedValue(conflictError);

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(controller.register(registerDto)).rejects.toThrow('Email já está em uso');
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('deve lançar erro genérico quando service falha', async () => {
      // Arrange
      const genericError = new Error('Erro ao registrar cliente: Database error');
      service.register.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.register(registerDto)).rejects.toThrow(genericError);
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });
  });

  // Testes para o método login
  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange
      service.login.mockResolvedValue(mockAuthResponse);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('deve lançar UnauthorizedException quando credenciais são inválidas', async () => {
      // Arrange
      const unauthorizedError = new UnauthorizedException('Credenciais inválidas');
      service.login.mockRejectedValue(unauthorizedError);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(controller.login(loginDto)).rejects.toThrow('Credenciais inválidas');
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('deve lançar erro genérico quando service falha', async () => {
      // Arrange
      const genericError = new Error('Erro ao fazer login: Database error');
      service.login.mockRejectedValue(genericError);

      // Act & Assert
      await expect(controller.login(loginDto)).rejects.toThrow(genericError);
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  // Testes para o método getProfile
  describe('getProfile', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      // Arrange
      const mockRequest = {
        user: mockUser,
      };

      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('deve retornar undefined quando usuário não está autenticado', async () => {
      // Arrange
      const mockRequest = {
        user: undefined,
      };

      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(result).toBeUndefined();
    });

    it('deve retornar null quando usuário é null', async () => {
      // Arrange
      const mockRequest = {
        user: null,
      };

      // Act
      const result = await controller.getProfile(mockRequest);

      // Assert
      expect(result).toBeNull();
    });
  });
});
