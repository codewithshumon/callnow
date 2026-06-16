import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async listContacts(
    @CurrentUser('id') userId: string,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contactsService.listContacts(
      userId,
      search,
      tag,
      page ? +page : 1,
      limit ? +limit : 50,
    );
  }

  @Post()
  async createContact(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.createContact(userId, dto);
  }

  @Put(':id')
  async updateContact(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.updateContact(userId, id, dto);
  }

  @Delete(':id')
  async deleteContact(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.contactsService.deleteContact(userId, id);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('contacts'))
  async importContacts(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.contactsService.importContacts(userId, file.buffer);
  }
}
