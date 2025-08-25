import { IsOptional, Matches } from 'class-validator';
export class UpdateCategoryDto {
  @IsOptional() name?: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;
  parentId?: string;
}