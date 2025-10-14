export class CreateReviewDto {
  productId: string;
  name: string;
  comment: string;
  rating: number;
  anonymous: boolean;
  createdAt?: Date;
  images?: string[];
}
