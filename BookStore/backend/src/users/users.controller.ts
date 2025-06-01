import { Controller, Get, Post, Body, Param, Req, UseGuards, NotFoundException, Patch, Delete, Put, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { JwtAuthGuard } from './auth/jwt.auth.guard';
import { AuthService } from './auth/auth.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';

@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService,
    private readonly authService: AuthService
  ) {}

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

  @Patch(':id/update-password')
  async updatePassword(
    @Param('id') id: string,
    @Body() dto: UpdatePasswordDto,
  ) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException('Không tìm thấy ID người dùng!');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng!');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    user.password = hashedPassword;
    await user.save(); // không còn báo lỗi

    return { message: 'Cập nhật mật khẩu thành công' };
  }


}
