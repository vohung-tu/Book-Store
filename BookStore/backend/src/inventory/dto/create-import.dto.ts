import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class ImportLineDto {
  @IsString() @IsNotEmpty()
  bookId: string;


  @IsNumber() @IsPositive()
  quantity: number;


  @IsNumber() @Min(0)
  @IsOptional()
  unitPrice?: number;
  }


export class CreateImportDto {
  @IsDateString()
  date: string; // ISO


  @IsString() @IsOptional()
  supplierName?: string;


  @IsString() @IsOptional()
  reason?: string;


  @IsArray() @ValidateNested({ each: true })
  @Type(() => ImportLineDto)
  lines: ImportLineDto[];
}