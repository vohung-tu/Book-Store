import { Author } from "./author.model";
import { Review } from "./review.model";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | { _id: string; name: string; slug: string } | null;
  children?: Category[];
}

export interface BookDetails {
  id?: string;
  _id:string; // mongodb tự tạo ra
  title: string;
  description: string;
  author: Author;
  price: number;
  flashsale_price?: number;
  discount_percent?: number;
  coverImage: string;
  images?: string[];
  publishedDate: Date;
  quantity?: number;
  categoryName: Category;
  reviews?: Review[];
  [key: string]: any;
  cartItemId: string;
  sold?: number;
}