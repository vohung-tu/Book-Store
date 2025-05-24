export interface Product {
  _id: string;
  title: string;
  author: string;
  price: number;
  flashsale_price: number;
  discount_percent: number;
  coverImage: string;
  quantity: number;
  categoryName: string;
}
export interface Order {
  _id: string;
  userId: string;
  address: string;
  note: string;
  products: Product[];
  name: string;
  phone: number;
  email: string;
  total: number;
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled' | 'returned';
  orderDate: string;
  createdAt: string;
}