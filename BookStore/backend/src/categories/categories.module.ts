// src/category/category.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './categories.schema';
import { CategoryAdminController, CategoryPublicController } from './categories.controller';
import { CategoryService } from './categories.service';


@Module({
  imports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])],
  controllers: [CategoryAdminController, CategoryPublicController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}
