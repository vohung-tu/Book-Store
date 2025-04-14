import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { SignupDto } from "src/users/dto/signup.dto";
import { JwtAuthGuard } from "src/users/auth/jwt.auth.guard";
import { Role } from "src/users/auth/role.enum";
import { Roles } from "src/users/auth/roles.decorator";
import { RolesGuard } from "src/users/auth/roles.guard";

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/create-user')
  @Roles(Role.ADMIN)
  async createUserByAdmin(@Body() dto: SignupDto) {
    return this.usersService.createByAdmin(dto);
  }
  @Get('check-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  checkRole(@Req() req) {
    return { message: 'Bạn là admin!', user: req.user };
  }

  @Delete('/:id')
  @Roles(Role.ADMIN)
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
    
}