import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  full_name: string;

  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  @IsOptional()
  password?: string;
  re_password?: string;

  birth: string;

  @IsNotEmpty()
  address?: string;
  phone_number: number;

  @IsOptional()
  role?: string;
}
