import { Controller, Post, Body, Get, Query, UseInterceptors, BadRequestException, UploadedFiles } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './review.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Review } from './review.schema';


@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('bulk')
  async getReviewsBulk(@Query('ids') ids: string) {
    const bookIds = ids.split(','); // "id1,id2,id3"
    return this.reviewService.getReviewsForManyBooks(bookIds);
  }

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto) {
    return await this.reviewService.create(createReviewDto);
  }

  @Get()
  async findByProductId(@Query('productId') productId: string) {
    return await this.reviewService.findByProductId(productId);
  }

  @Get()
  async findReviews(@Query('productId') productId?: string) {
    if (productId) {
      return await this.reviewService.findByProductId(productId);
    }
    return await this.reviewService.findAll(); // ✅ Trả về tất cả bình luận
  }
  @Post()
  @UseInterceptors(
    FilesInterceptor('media', 5, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype.startsWith('image/') ||
          (file.mimetype.startsWith('video/') && file.size <= 10 * 1024 * 1024)
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type or size'), false);
        }
      },
    })
  )
  async createReview(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
  ): Promise<Review> {
    const images = files.filter(f => f.mimetype.startsWith('image/')).map(f => f.path);
    return this.reviewService.create({ ...body, images });
  }
}
