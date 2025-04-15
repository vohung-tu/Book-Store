export interface Address {
  value: string;      // Địa chỉ
  isDefault: boolean; // Cờ chỉ định địa chỉ mặc định
}
export interface User {
  id: string;
  _id: string;
  email: string;
  full_name: string;
  password: string;
  re_password: string;
  birth: Date;
  address: Address[];
  username: string;
  phone_number: number;
  role: 'admin' | 'user';
  province: string;
  district: string;
  ward: string;
  note: string;
  payment: string;
}
