import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './review.dto';
import { Review } from './review.schema';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /** 📦 Lấy danh sách review cho nhiều sách cùng lúc (dashboard dùng) */
  @Get('bulk')
  async getReviewsBulk(@Query('ids') ids: string) {
    const bookIds = ids.split(','); // "id1,id2,id3"
    return this.reviewService.getReviewsForManyBooks(bookIds);
  }

  /** 🧾 Lấy toàn bộ review hoặc theo productId */
  @Get()
  async find(@Query('productId') productId?: string) {
    if (productId) {
      return this.reviewService.findByProductId(productId);
    }
    return this.reviewService.findAll(); // ✅ trả toàn bộ bình luận
  }

  /** ✍️ Tạo review mới (có thể kèm hình ảnh/video) */
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
    }),
  )
  async createReview(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: CreateReviewDto,
  ): Promise<Review> {
    const images =
      files?.filter((f) => f.mimetype.startsWith('image/')).map((f) => f.path) ??
      [];
    return this.reviewService.create({ ...body, images });
  }
}
