export interface Order {
  _id: string;
  userId: string;
  address: string;
  note: string;
  products: {
    _id: string;
    title: string;
    author: string;
    price: number;
    flashsale_price: number;
    discount_percent: number;
    coverImage: string;
    quantity: number;
    categoryName: string;
  }[];
  name: string;
  phone: number;
  email: string;
  total: number;
  orderDate: string;
  createdAt: string;
}