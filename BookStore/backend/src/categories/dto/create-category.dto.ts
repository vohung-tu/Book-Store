import { IsMongoId, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty() name: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/) // cho phép tự truyền slug hợp lệ
  slug?: string;

  @IsOptional()
  @IsMongoId({ message: 'parentId phải là ObjectId hợp lệ' })
  parentId?: string;
}