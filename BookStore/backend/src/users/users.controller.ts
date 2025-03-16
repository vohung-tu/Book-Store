import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { AuthenticatedRequest } from './auth/auth.interface';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('user-info')
  async getUserInfo(@Req() req: AuthenticatedRequest) {
    return req.user;  // Trả về thông tin user
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.usersService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.usersService.signin(dto);
  }

  @Get()
  async getUsers() {
    return this.usersService.findAll(); // Trả về danh sách người dùng
  }
}
