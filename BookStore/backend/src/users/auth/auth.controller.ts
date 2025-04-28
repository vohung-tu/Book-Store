import { Body, Controller, Get, NotFoundException, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from './auth.interface';
import { JwtAuthGuard } from './jwt.auth.guard';
import { UsersService } from '../users.service';

@Controller('auth') // <-- nghĩa là route này sẽ là /auth/...
export class AuthController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Req() req) {
        // req.user được lấy từ JwtStrategy.validate()
        return req.user;
    }

    @Get('user-info')
    async getUserInfo(@Req() req: AuthenticatedRequest) {
        return req.user;
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
  
}