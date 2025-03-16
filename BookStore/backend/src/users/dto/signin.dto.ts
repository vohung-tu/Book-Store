import { IsEmail, MinLength } from 'class-validator';

export class SigninDto {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}