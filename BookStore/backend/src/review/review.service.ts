import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './review.dto';
import { Review, ReviewDocument } from './review.schema';
;

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const createdReview = new this.reviewModel(createReviewDto);
    return createdReview.save();
  }

  async findAll(): Promise<Review[]> {
    return this.reviewModel.find().exec();
  }

  async findByProductId(productId: string): Promise<Review[]> {
    return this.reviewModel.find({ productId }).exec();
  }

  async getReviewsForManyBooks(bookIds: string[]) {
    const reviews = await this.reviewModel.find({
      productId: { $in: bookIds },
    }).lean();

    // Gom review theo bookId
    const result: Record<string, any[]> = {};
    for (const r of reviews) {
      const id = r.productId.toString();
      if (!result[id]) result[id] = [];
      result[id].push(r);
    }
    return result;
  }

  // Có thể thêm phương thức findByProductId nếu cần
}
