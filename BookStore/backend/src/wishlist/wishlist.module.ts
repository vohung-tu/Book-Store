import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';
import { UsersModule } from 'src/users/users.module';
import { WishlistService } from './wishlist.service';
import { Wishlist, WishlistSchema } from './wishlist.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wishlist.name, schema: WishlistSchema }]),
    UsersModule],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService]
})
export class WishlistModule {}
