import { IsDateString, IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';


export class QueryReceiptsDto {
  @IsEnum(['import', 'export'], { message: 'type must be import|export', each: false })
  @IsOptional()
  type?: 'import' | 'export';


  @IsDateString() @IsOptional()
  from?: string; // ISO


  @IsDateString() @IsOptional()
  to?: string; // ISO


  @IsString() @IsOptional()
  q?: string; // search by code/supplier/receiver/reason


  @IsNumberString() @IsOptional()
  page?: string; // default 1


  @IsNumberString() @IsOptional()
  limit?: string; // default 20
}