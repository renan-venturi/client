import { IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBalanceDto {
  @ApiProperty({
    description: 'Valor a ser adicionado ou subtraído do saldo',
    example: 100.50,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Valor deve ser um número' })
  @IsPositive({ message: 'Valor deve ser positivo' })
  @Min(0.01, { message: 'Valor deve ser maior que R$ 0,01' })
  amount: number;
}
