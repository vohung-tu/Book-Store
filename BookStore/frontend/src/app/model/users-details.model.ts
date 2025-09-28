export interface Address {
  value: string;      // Địa chỉ
  isDefault: boolean; // Cờ chỉ định địa chỉ mặc định
  fullName?: string;
  phoneNumber?: number;
}
export interface User {
  id: string;
  _id: string;
  email: string;
  full_name: string;
  password: string;
  birth: Date;
  address: Address[];
  username: string;
  phone_number: number;
  role: 'admin' | 'user';
  note: string;
  payment: string;
  createdAt?: string;  // ✅ thêm
  updatedAt?: string;
}
