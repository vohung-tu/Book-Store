import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Supplier } from './supplier.schema';

@Injectable()
export class SuppliersService {
  constructor(@InjectModel(Supplier.name) private supplierModel: Model<Supplier>) {}

  async findAll() {
    return this.supplierModel.find().sort({ name: 1 }).lean();
  }

  async findOne(id: string) {
    const found = await this.supplierModel.findById(id);
    if (!found) throw new NotFoundException('Không tìm thấy nhà cung cấp');
    return found;
  }

  async create(data: any) {
    const code = data.code || `NCC${Date.now().toString().slice(-5)}`;
    return this.supplierModel.create({ ...data, code });
  }

  async update(id: string, data: any) {
    const updated = await this.supplierModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new NotFoundException('Không tồn tại NCC');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.supplierModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Không tồn tại NCC');
    return { message: 'Đã xoá nhà cung cấp' };
  }

  // 📤 Xuất Excel
  async exportExcel() {
    const data = await this.supplierModel.find().lean();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    return buffer;
  }

  // 📥 Nhập Excel
  async importExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    // 👇 thêm kiểu rõ ràng
    const inserted: Supplier[] = [];

    for (const row of rows) {
        const code = row['Mã NCC'] || row['Code'];
        const name = row['Tên NCC'] || row['Name'];
        if (!name) continue;

        const supplier = {
        code,
        name,
        address: row['Địa chỉ'] || '',
        email: row['Email'] || '',
        phone: row['SĐT'] || '',
        note: row['Ghi chú'] || ''
        };

        const created = await this.supplierModel.create(supplier);
        inserted.push(created.toObject ? created.toObject() : created); // ✅ ép về object nếu cần
    }

    return { count: inserted.length };
    }
}
