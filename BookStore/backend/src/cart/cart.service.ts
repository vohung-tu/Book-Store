import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CartItem, CartItemDocument } from "./cart.schema";
import { Model } from "mongoose";

@Injectable()
export class CartService {
    constructor(@InjectModel(CartItem.name) private cartModel: Model<CartItemDocument>) {}

    // Lấy giỏ hàng của user
    async getUserCart(userId: string) {
        const items = await this.cartModel.find({ user: userId })
            .populate({
            path: 'product',
            select: 'title price flashsale_price coverImage', // chỉ field cần
            })
            .lean();

        return items.map((it: any) => ({
            cartItemId: it._id,
            productId: it.product?._id,
            ...it.product,
            quantity: it.quantity,
        }));
        }

    // Thêm sản phẩm vào giỏ
    async addToCart(userId: string, productId: string) {
        const existing = await this.cartModel.findOne({ user: userId, product: productId });
        if (existing) {
            existing.quantity += 1;
            return existing.save();
        } else {
            return this.cartModel.create({ user: userId, product: productId, quantity: 1 });
        }
    }

    // Cập nhật số lượng dựa trên cartItemId
    async updateQuantity(userId: string, cartItemId: string, change: number) {
        const cartItem = await this.cartModel.findOne({ _id: cartItemId, user: userId });
        if (!cartItem) throw new Error('Item not found in cart');

        cartItem.quantity += change;
        if (cartItem.quantity < 1) cartItem.quantity = 1;

        return cartItem.save();
    }


    // Xóa 1 sản phẩm khỏi giỏ
    async removeItem(userId: string, cartItemId: string) {
        return this.cartModel.deleteOne({ _id: cartItemId, user: userId });
    }

    // Xóa toàn bộ giỏ hàng
    async clearCart(userId: string) {
        return this.cartModel.deleteMany({ user: userId });
    }
}
