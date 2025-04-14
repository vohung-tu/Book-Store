export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  province: string;
  district: string;
  ward: string;
  isDefault?: boolean;
}