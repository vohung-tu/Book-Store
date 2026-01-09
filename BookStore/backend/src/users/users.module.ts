import { forwardRef, Module } from '@nestjs/common';
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
import { MailService } from 'src/order/order/email.service';
import { LoyaltyModule } from 'src/loyalty/loyalty.module';
import { BooksModule } from 'src/books/books.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    BooksModule,
    JwtModule.register({ secret: 'secretKey', signOptions: { expiresIn: '1d' } }),
    PassportModule,
    forwardRef(() => LoyaltyModule),

  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, JwtAuthGuard,
    RolesGuard, AuthService, MailService], 
  exports: [UsersService],
})
export class UsersModule {}
