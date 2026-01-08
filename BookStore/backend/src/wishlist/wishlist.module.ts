import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [WishlistController],
})
export class WishlistModule {}
