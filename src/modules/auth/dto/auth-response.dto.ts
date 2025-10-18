import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do cliente autenticado',
  })
  user: {
    id: string;
    name: string;
    email: string;
    bankingAgency: string;
    bankingAccount: string;
  };
}
