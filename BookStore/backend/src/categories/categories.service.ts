// src/category/category.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { toSlug } from './slug.util';
import { Category, CategoryDocument } from './categories.schema';

@Injectable()
export class CategoryService {
  constructor(@InjectModel(Category.name) private model: Model<CategoryDocument>) {}

  async findAll() {
    return this.model.find().sort({ name: 1 }).lean();
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ? dto.slug : toSlug(dto.name);
    try {
      return await this.model.create({ name: dto.name, slug });
    } catch (e) {
      if (e.code === 11000) throw new ConflictException('Slug đã tồn tại');
      throw e;
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const update: any = { ...dto };
    if (dto.name && !dto.slug) update.slug = toSlug(dto.name);
    const cat = await this.model.findByIdAndUpdate(id, update, { new: true });
    if (!cat) throw new NotFoundException('Không tìm thấy category');
    return cat;
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Không tìm thấy category');
    return { deleted: true };
  }
}
