export interface Coupon {
  _id?: string;
  code: string;
  title: string;
  description: string;
  condition: string;
  type: 'percent' | 'amount';
  value: number;
  minOrder?: number;                 // đổi từ minOrderAmount
  applicableProductIds?: string[];
  categories?: string[];
  startDate?: string;
  endDate?: string;
  usageCount?: number;
  usageLimit?: number;
  status?: 'active' | 'disabled' | 'expired';
}