import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'normalizeString'
})
export class NormalizeStringPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    return value
      .normalize('NFD') // chuyển ký tự có dấu thành chuỗi có dấu cách
      .replace(/[\u0300-\u036f]/g, '') // xóa dấu
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }
}
