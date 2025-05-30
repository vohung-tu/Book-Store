import { Author } from "./author.model";
import { Review } from "./review.model";

export interface BookDetails {
  id?: string,
  _id:string,
  title: string,
  description: string,
  author: Author,
  price: number,
  flashsale_price?: number,
  discount_percent?: number,
  coverImage: string,
  images?: string[];
  publishedDate: Date,
  quantity?: number,
  categoryName: string,
  reviews?: Review[];
}