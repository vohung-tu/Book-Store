import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Wishlist, WishlistDocument } from "./wishlist.schema";

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>
  ) {}

  async addToWishlist(userId: string, bookId: string) {
    const userObjId = new Types.ObjectId(userId);
    const bookObjId = new Types.ObjectId(bookId);

    return this.wishlistModel.findOneAndUpdate(
      { userId: userObjId, bookId: bookObjId }, // Tìm bản ghi khớp cả 2 ID
      { userId: userObjId, bookId: bookObjId }, // Cập nhật/Chèn mới bằng ObjectId
      { upsert: true, new: true }
    );
  }

  async removeFromWishlist(userId: string, bookId: string) {

    const result = await this.wishlistModel.deleteOne({
      $and: [
        { userId: { $in: [userId, new Types.ObjectId(userId)] } },
        { bookId: { $in: [bookId, new Types.ObjectId(bookId)] } }
      ]
    }).exec();

    return result;
  }

  async getWishlist(userId: string) {
    const items = await this.wishlistModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'bookId',
        select: 'title price flashsale_price coverImage discount_percent',
      })
      .lean();
    
    // Map lại để trả về mảng các Book giống như cũ cho Frontend không bị gãy
    return items.map(item => item.bookId);
  }
}