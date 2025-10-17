import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class FilterClientDto {
  @ApiPropertyOptional({
    description: 'Filtrar clientes por nome',
    example: 'João',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar clientes por email',
    example: 'joao@example.com',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  email?: string;
}
