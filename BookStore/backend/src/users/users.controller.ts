import { Controller, Get, Post, Body, Param, Req, UseGuards, NotFoundException, Patch, Delete, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { AuthenticatedRequest } from './auth/auth.interface';
import { JwtAuthGuard } from './auth/jwt.auth.guard';
import { AuthService } from './auth/auth.service';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

  // @Get('me')
  // @UseGuards(JwtAuthGuard)
  // async getProfile(@Req() req: any) {
  //   const userId = req.user?._id;
  //   return this.usersService.findById(userId);
  // }
  
  // @Get('user-info')
  // @UseGuards(JwtAuthGuard)
  // async getUserInfo(@Req() req: AuthenticatedRequest) {
  //   return req.user;
  // }

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.usersService.signup(dto);
  }

  @Post('signin')
  signin(@Body() dto: SigninDto) {
    return this.authService.signin(dto);
  }

  @Get()
  async getUsers() {
    return this.usersService.findAll(); // Trả về danh sách người dùng
  }
  
  @Get(':userId/addresses')
  @UseGuards(JwtAuthGuard) // Bảo vệ endpoint nếu cần
  async getAddresses(@Param('userId') userId: string) {
    const user = await this.usersService.findById(userId); // Lấy user từ DB
    return { address: user.address }; // Trả về danh sách địa chỉ
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const result = await this.usersService.deleteUser(id);
    if (!result) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
    return { message: 'Xoá người dùng thành công' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/address')
  async updateAddress(
    @Param('id') id: string,
    @Body('address') address: { value: string; isDefault: boolean }[]
  ) {
    if (
      !Array.isArray(address) ||
      !address.every(
        (a) =>
          typeof a.value === 'string' &&
          typeof a.isDefault === 'boolean'
      )
    ) {
      throw new NotFoundException('Danh sách địa chỉ không hợp lệ');
    }

    const updatedUser = await this.usersService.updateAddress(id, address);
    if (!updatedUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return updatedUser;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUser(id, body);
  }

  // @Get(':id')
  // async getUserById(@Param('id') id: string) {
  //   const user = await this.usersService.findById(id);
  //   if (!user) {
  //     throw new NotFoundException(`Không tìm thấy user với ID: ${id}`);
  //   }
  //   return user;
  // }

}
