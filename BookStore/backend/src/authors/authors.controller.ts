import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { Author } from './authors.schema';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Get()
  async getAuthors() {
    return this.authorsService.findAll();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/authors',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createAuthor(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const avatarUrl: string | undefined = file
      ? `/uploads/authors/${file.filename}`
      : undefined;

    return this.authorsService.create({
      name: body.name,
      description: body.description,
      dateUpdate: new Date(body.dateUpdate),
      avatar: avatarUrl,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Author> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Id không hợp lệ');
    }
    const author = await this.authorsService.findById(id);
    if (!author) {
      throw new NotFoundException('Author not found');
    }
    return author;
  }
  
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads/authors',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
    async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Id không hợp lệ');
    }

    const avatarUrl: string | undefined = file
      ? `/uploads/authors/${file.filename}`
      : undefined;

    return this.authorsService.update(id, {
      name: body.name,
      description: body.description,
      dateUpdate: new Date(body.dateUpdate),
      ...(avatarUrl && { avatar: avatarUrl }),
    });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Id không hợp lệ');
    }
    return this.authorsService.delete(id);
  }
}
