import { Controller, Delete, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/users/auth/jwt.auth.guard";
import { UsersService } from "src/users/users.service";

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly usersService: UsersService) {}

  @Post(':bookId')
  addToWishlist(
    @Req() req,
    @Param('bookId') bookId: string
  ) {
    return this.usersService.addToWishlist(req.user._id, bookId);
  }

  @Delete(':bookId')
  removeFromWishlist(
    @Req() req,
    @Param('bookId') bookId: string
  ) {
    return this.usersService.removeFromWishlist(req.user._id, bookId);
  }

  @Get()
  getWishlist(@Req() req) {
    return this.usersService.getWishlist(req.user._id);
  }
}
