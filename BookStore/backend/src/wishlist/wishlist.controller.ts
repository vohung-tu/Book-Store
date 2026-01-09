import { Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/users/auth/jwt.auth.guard";
import { WishlistService } from "./wishlist.service";

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':bookId')
  addToWishlist(
    @Req() req,
    @Param('bookId') bookId: string
  ) {
    return this.wishlistService.addToWishlist(req.user._id, bookId);
  }

  @Delete(':bookId')
  removeFromWishlist(
    @Req() req,
    @Param('bookId') bookId: string
  ) {
    return this.wishlistService.removeFromWishlist(req.user._id, bookId);
  }

  @Get()
  getWishlist(@Req() req) {
    return this.wishlistService.getWishlist(req.user._id);
  }
}
