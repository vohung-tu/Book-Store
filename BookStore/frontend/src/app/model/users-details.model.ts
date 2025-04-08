export interface User {
  id: string;
  _id: string;
  email: string;
  full_name: string;
  password: string;
  re_password: string;
  birth: Date;
  address: string;
  username: string;
  phone_number: number;
  role: 'admin' | 'user';
  province: string;
  district: string;
  ward: string;
  note: string;
  payment: string;
}
