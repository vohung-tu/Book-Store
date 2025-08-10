import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CartService } from "./cart.service";

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
    constructor(private cartService: CartService) {}

    @Get()
    getCart(@Req() req) {
        if (!req.user?._id) {
            return [];
        }
        return this.cartService.getUserCart(req.user._id);
    }

    @Post(':productId')
    addToCart(@Req() req, @Param('productId') productId: string) {
        return this.cartService.addToCart(req.user._id, productId);
    }

    @Patch(':productId')
    updateQuantity(@Req() req, @Param('productId') productId: string, @Body('quantity') quantity: number) {
        return this.cartService.updateQuantity(req.user._id, productId, quantity);
    }

    @Delete(':productId')
    removeItem(@Req() req, @Param('productId') productId: string) {
        return this.cartService.removeItem(req.user._id, productId);
    }

    @Delete()
    clearCart(@Req() req) {
        return this.cartService.clearCart(req.user._id);
    }

}