import { ApiProperty } from '@nestjs/swagger';

export class BalanceResponseDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: 'clh1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Saldo atual da conta',
    example: 1500.75,
  })
  balance: number;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
