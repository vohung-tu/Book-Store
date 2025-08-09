import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CartItem, CartItemDocument } from "./cart.schema";
import { Model } from "mongoose";

@Injectable()
export class CartService {
    constructor(@InjectModel(CartItem.name) private cartModel: Model<CartItemDocument>) {}

    async getUserCart(userId: string) {
        return this.cartModel.find({user: userId}).populate('product');
    }

    async addToCart(userId: string, productId: string) {
        const existing = await this.cartModel.findOne({ user: userId, product: productId});
        if (existing) {
            existing.quantity += 1;
            return existing.save();
        } else {
            return this.cartModel.create({ user: userId, product: productId, quantity: 1 });
        }
    }

    async updateQuantity(userId: string, productId: string, quantity: number) {
        return this.cartModel.findOneAndUpdate(
            { user: userId, product: productId},
            { quantity },
            { new: true }
        );
    }

    async removeItem(userId: string, productId: string) {
        return this.cartModel.deleteOne({ user: userId, product: productId });
    }

    async clearCart(userId: string) {
        return this.cartModel.deleteMany({ user: userId })
    }
}
