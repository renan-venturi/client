import { IsEmail, IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
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
}
