import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { AuthController } from './auth.controller';
import { UsersService } from '../users.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user.schema';
import { AuthService } from './auth.service';
import { MailService } from 'src/order/order/email.service';
import { UsersModule } from '../users.module';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    forwardRef(() => UsersModule),
    forwardRef(() => LoyaltyModule),
    JwtModule.register({
      secret: 'secretKey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [UsersService, JwtStrategy, RolesGuard, AuthService, MailService],
  exports: [JwtModule, AuthService, UsersService],
})
export class AuthModule {}
