import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(['pending', 'processing', 'shipping', 'completed', 'cancelled', 'returned'])
  status: string;
}