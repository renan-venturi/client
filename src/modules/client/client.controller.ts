import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto, FilterClientDto, ClientResponseDto, UpdateProfilePictureDto, UpdateProfilePictureResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente criado com sucesso',
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou expirado',
  })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os clientes' })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filtrar por nome',
    example: 'João',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filtrar por email',
    example: 'joao@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes retornada com sucesso',
    type: [ClientResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou expirado',
  })
  async findAll(@Query() filterDto: FilterClientDto) {
    return this.clientService.findAll(filterDto);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Filtrar clientes por nome' })
  @ApiQuery({
    name: 'name',
    required: true,
    description: 'Nome para filtrar',
    example: 'João',
  })
  @ApiResponse({
    status: 200,
    description: 'Clientes filtrados com sucesso',
    type: [ClientResponseDto],
  })
  async filterByName(@Query('name') name: string) {
    return this.clientService.findAll({ name });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único do cliente',
    example: 'clh1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado com sucesso',
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  async findOne(@Param('id') id: string) {
    return this.clientService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID único do cliente',
    example: 'clh1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente atualizado com sucesso',
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(id, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID único do cliente',
    example: 'clh1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Cliente excluído com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  async remove(@Param('id') id: string) {
    return this.clientService.remove(id);
  }

  @Patch(':id/profile-picture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar foto de perfil do cliente' })
  @ApiParam({
    name: 'id',
    description: 'ID único do cliente',
    example: 'clh1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Foto de perfil atualizada com sucesso',
    type: UpdateProfilePictureResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente não encontrado',
  })
  async updateProfilePicture(
    @Param('id') id: string,
    @Body() updateProfilePictureDto: UpdateProfilePictureDto,
  ): Promise<UpdateProfilePictureResponseDto> {
    return this.clientService.updateProfilePicture(id, updateProfilePictureDto);
  }
}
