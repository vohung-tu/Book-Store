import { Review } from "./review.model";

export interface BookDetails {
  id?: string,
  _id:string,
  title: string,
  description: string,
  author: string,
  price: number,
  flashsale_price?: number,
  discount_percent?: number,
  coverImage: string, //link
  publishedDate: Date,
  quantity?: number,
  categoryName: string,
  reviews?: Review[];
}