import { IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty() name: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/) // cho phép tự truyền slug hợp lệ
  slug?: string;
}