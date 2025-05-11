import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './review.dto';


@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto) {
    return await this.reviewService.create(createReviewDto);
  }

  @Get()
  async findByProductId(@Query('productId') productId: string) {
    return await this.reviewService.findByProductId(productId);
  }
}
