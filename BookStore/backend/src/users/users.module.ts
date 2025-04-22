import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './user.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt.auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth/auth.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({ secret: 'secretKey', signOptions: { expiresIn: '1d' } }),
    PassportModule
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, JwtAuthGuard,
    RolesGuard, AuthService], 
  exports: [UsersService],
})
export class UsersModule {}
