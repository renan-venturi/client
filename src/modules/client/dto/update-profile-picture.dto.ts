import { IsString, IsNotEmpty, IsUrl, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfilePictureDto {
  @ApiProperty({
    description: 'URL da nova foto de perfil',
    example: 'https://example.com/profile-picture.jpg',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'URL da foto de perfil é obrigatória' })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    { message: 'profilePicture deve ser uma URL válida com protocolo http ou https' }
  )
  @Matches(
    /\.(jpg|jpeg|png|gif|webp|svg)$/i,
    { message: 'profilePicture deve ser uma imagem válida (jpg, jpeg, png, gif, webp, svg)' }
  )
  @Length(10, 500, { message: 'URL deve ter entre 10 e 500 caracteres' })
  profilePicture: string;
}
