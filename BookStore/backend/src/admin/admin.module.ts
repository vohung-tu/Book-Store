import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/users/auth/auth.module';

@Module({
  imports: [
    UsersModule,
    AuthModule
    ],  // Import UsersService
  controllers: [AdminController],
})
export class AdminModule {}