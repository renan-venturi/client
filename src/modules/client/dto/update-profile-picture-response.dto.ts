import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfilePictureResponseDto {
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
    description: 'URL da foto de perfil atualizada',
    example: 'https://example.com/profile.jpg',
  })
  profilePicture: string;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}
