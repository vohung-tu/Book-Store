import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './review.dto';
import { Review, ReviewDocument } from './review.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  /** ✍️ Tạo review mới */
  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const createdReview = new this.reviewModel(createReviewDto);
    return createdReview.save();
  }

  /** 📋 Lấy toàn bộ review (dashboard dùng) */
  async findAll(): Promise<Review[]> {
    return this.reviewModel
      .find()
      .populate('productId', 'title')
      .populate('userId', 'full_name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** 📚 Lấy review theo sách cụ thể */
  async findByProductId(productId: string): Promise<Review[]> {
    return this.reviewModel
      .find({ productId })
      .populate('userId', 'full_name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** ⚡ Lấy nhiều review theo danh sách ID sách */
  async getReviewsForManyBooks(bookIds: string[]) {
    const reviews = await this.reviewModel
      .find({ productId: { $in: bookIds } })
      .lean();

    // Gom review theo productId
    const result: Record<string, any[]> = {};
    for (const r of reviews) {
      const id = r.productId.toString();
      if (!result[id]) result[id] = [];
      result[id].push(r);
    }
    return result;
  }
}
