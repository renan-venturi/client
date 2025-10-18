import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      // Verificar se email já existe
      const existingClient = await this.prisma.client.findUnique({
        where: { email: registerDto.email },
      });

      if (existingClient) {
        throw new ConflictException('Email já está em uso');
      }

      // Criptografar senha
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Criar cliente
      const client = await this.prisma.client.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password: hashedPassword,
          bankingAgency: registerDto.bankingAgency,
          bankingAccount: registerDto.bankingAccount,
        },
      });

      // Gerar token JWT
      const payload = { sub: client.id, email: client.email };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: client.id,
          name: client.name,
          email: client.email,
          bankingAgency: client.bankingAgency,
          bankingAccount: client.bankingAccount,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error('Erro ao registrar cliente: ' + error.message);
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      // Buscar cliente por email
      const client = await this.prisma.client.findUnique({
        where: { email: loginDto.email },
      });

      if (!client) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(loginDto.password, client.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Gerar token JWT
      const payload = { sub: client.id, email: client.email };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: client.id,
          name: client.name,
          email: client.email,
          bankingAgency: client.bankingAgency,
          bankingAccount: client.bankingAccount,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error('Erro ao fazer login: ' + error.message);
    }
  }

  async validateUser(userId: string) {
    try {
      const client = await this.prisma.client.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          bankingAgency: true,
          bankingAccount: true,
        },
      });

      if (!client) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return client;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error('Erro ao validar usuário: ' + error.message);
    }
  }
}
