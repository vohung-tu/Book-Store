// src/category/category.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreateCategoryDto, } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './categories.service';

@UseGuards(AuthGuard('jwt')) // + RolesGuard('admin') nếu bạn có phân quyền
@Controller('admin/categories')
export class CategoryAdminController {
  constructor(private readonly service: CategoryService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() dto: CreateCategoryDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}

// Public cho FE user
@Controller('categories')
export class CategoryPublicController {
  constructor(private readonly service: CategoryService) {}
  @Get() findAll() { return this.service.findAll(); } // dùng cho menu FE
}
