import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsNotEmpty()
  full_name: string;

  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
  re_password: string;

  @IsNotEmpty()
  birth: string;

  address?: string;
  phone_number: number;
}
