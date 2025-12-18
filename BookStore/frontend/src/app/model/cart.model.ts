export interface CartItem {
  _id: string;
  productId: string;
  title: string;
  coverImage: string;
  price: number;
  flashsale_price?: number;
  quantity: number;
  categoryName: string;
}