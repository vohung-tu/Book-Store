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
    const suppliers = await this.supplierModel.find().lean();

    const exportData = suppliers.map((s, index) => ({
      '_id': s._id.toString(),             
      'STT': index + 1,
      'Mã NCC': s.code || '',
      'Tên NCC': s.name || '',
      'Địa chỉ': s.address || '',
      'Email': s.email || '',
      'SĐT': s.phone || '',
      'Ghi chú': s.note || '',
      'Ngày tạo': s.createdAt
        ? new Date(s.createdAt).toLocaleDateString('vi-VN')
        : '',
      'Cập nhật lần cuối': s.updatedAt
        ? new Date(s.updatedAt).toLocaleDateString('vi-VN')
        : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws['!cols'] = [
      { wch: 24 },
      { wch: 5 },
      { wch: 15 },
      { wch: 30 },
      { wch: 35 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách NCC');

    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  }



  // 📥 Nhập Excel
  async importExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const id = row['_id'];                 // có trong file export
      const name = row['Tên NCC'];           // ❗ đúng header

      // ❌ Thiếu tên → bỏ qua
      if (!name) {
        skipped++;
        continue;
      }

      const data = {
        code: row['Mã NCC'] || '',
        name,
        address: row['Địa chỉ'] || '',
        email: row['Email'] || '',
        phone: row['SĐT'] || '',
        note: row['Ghi chú'] || ''
      };

      // 🔥 Có _id → thử update
      if (id) {
        const updatedDoc = await this.supplierModel.findByIdAndUpdate(
          id,
          data,
          { new: true }
        );

        if (updatedDoc) {
          updated++;
        } else {
          // ⚠ DB đã bị xoá → tạo mới
          await this.supplierModel.create(data);
          created++;
        }
      } 
      // 🔥 Không có _id → tạo mới
      else {
        await this.supplierModel.create(data);
        created++;
      }
    }

    return {
      message: 'Import Excel hoàn tất',
      created,
      updated,
      skipped
    };
  }

}
