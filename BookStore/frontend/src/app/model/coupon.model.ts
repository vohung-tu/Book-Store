export interface Coupon {
  _id?: string;
  code: string;
  title: string;
  description: string;
  condition: string;
  type: 'percent' | 'amount';
  value: number;
  minOrder?: number;
  applicableProductIds?: string[];
  categories?: string[];
  startDate?: Date | string;
  endDate?: Date | string;

  requiredLevel?: string[];

  usageCount?: number;
  usageLimit?: number;
  status?: 'active' | 'disabled' | 'expired';
}
