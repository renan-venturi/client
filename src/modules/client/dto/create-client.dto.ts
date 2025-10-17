import { IsEmail, IsString, IsOptional, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do cliente (mínimo 6 caracteres)',
    example: 'senha123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Telefone do cliente',
    example: '+5511999999999',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Endereço do cliente',
    example: 'Rua das Flores, 123',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Agência bancária',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}$/, {
    message: 'Agência deve conter exatamente 4 dígitos',
  })
  bankingAgency: string;

  @ApiProperty({
    description: 'Conta bancária',
    example: '56789-0',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}-\d{1}$/, {
    message: 'Conta deve estar no formato 12345-6',
  })
  bankingAccount: string;

  @ApiPropertyOptional({
    description: 'URL da foto de perfil',
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
