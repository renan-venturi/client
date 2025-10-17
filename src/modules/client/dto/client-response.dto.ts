import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({
    description: 'ID único do cliente',
    example: 'clh1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Telefone do cliente',
    example: '+5511999999999',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Endereço do cliente',
    example: 'Rua das Flores, 123',
  })
  address?: string;

  @ApiProperty({
    description: 'Agência bancária',
    example: '1234',
  })
  bankingAgency: string;

  @ApiProperty({
    description: 'Conta bancária',
    example: '56789-0',
  })
  bankingAccount: string;

  @ApiPropertyOptional({
    description: 'URL da foto de perfil',
    example: 'https://example.com/profile.jpg',
  })
  profilePicture?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
