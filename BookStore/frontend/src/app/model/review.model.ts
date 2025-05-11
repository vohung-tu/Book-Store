export interface Review {
  productId: string;
  name: string;
  comment: string;
  rating: number;
  anonymous: boolean;
  createdAt?: Date;
}