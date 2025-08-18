import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CartService } from "./cart.service";

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartService.getUserCart(req.user._id);
  }

  @Post(':productId') // thêm theo productId: OK
  addToCart(@Req() req, @Param('productId') productId: string) {
    return this.cartService.addToCart(req.user._id, productId);
  }

  // 👉 update theo cartItemId
  @Patch(':cartItemId')
  updateQuantity(
    @Req() req,
    @Param('cartItemId') cartItemId: string,
    @Body('change') change: number
  ) {
    return this.cartService.updateQuantity(req.user._id, cartItemId, change);
  }

  // 👉 xóa theo cartItemId
  @Delete(':cartItemId')
  removeItem(@Req() req, @Param('cartItemId') cartItemId: string) {
    return this.cartService.removeItem(req.user._id, cartItemId);
  }

  @Delete()
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user._id);
  }
}