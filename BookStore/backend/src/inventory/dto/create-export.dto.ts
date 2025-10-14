import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class ExportLineDto {
  @IsString() @IsNotEmpty()
  bookId: string;


  @IsNumber() @IsPositive()
  quantity: number;


  @IsNumber() @Min(0)
  @IsOptional()
  unitPrice?: number; 
}


export class CreateExportDto {
  @IsDateString()
  date: string;


  @IsString() @IsOptional()
  receiverName?: string;


  @IsString() @IsOptional()
  reason?: string;


  @IsArray() @ValidateNested({ each: true })
  @Type(() => ExportLineDto)
  lines: ExportLineDto[];
}