import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from './auth.interface';
import { JwtAuthGuard } from './jwt.auth.guard';
import { UsersService } from '../users.service';
import { AuthService } from './auth.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly usersService: UsersService,
        private readonly authService: AuthService
    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Req() req) {
        return req.user;
    }

    @Get('user-info')
    async getUserInfo(@Req() req: AuthenticatedRequest) {
        return req.user;
    }

    @Get('check-email')
    async checkEmail(@Query('email') email: string): Promise<{ exists: boolean }> {
        return this.authService.checkEmailExists(email);
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        const user = await this.usersService.findById(id);
        if (!user) throw new NotFoundException(`Không tìm thấy user với ID: ${id}`);
        return user;
    }

    @Get()
    async getUsers() {
        return this.usersService.findAll(); // Trả về danh sách người dùng
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/address')
    async updateAddress(
        @Param('id') id: string,
        @Body('address') address: { value: string; isDefault: boolean; fullName?: string; phoneNumber?: number }[]
        ) {
        if (
            !Array.isArray(address) ||
            !address.every(
            (a) =>
                typeof a.value === 'string' &&
                typeof a.isDefault === 'boolean' &&
                (a.fullName === undefined || typeof a.fullName === 'string') &&
                (a.phoneNumber === undefined || typeof a.phoneNumber === 'number')
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

    @Put('update/:id')
    async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(id, updateUserDto);
    }
}