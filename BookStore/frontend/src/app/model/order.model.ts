export interface OrderItem {
    title: string;
    price: number;
    quantity: number;
}

export interface Order {
    email: string;
    items: OrderItem[];
    totalPrice: number;
}