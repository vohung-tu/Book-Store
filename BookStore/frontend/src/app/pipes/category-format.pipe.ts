import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryFormat'
})
export class CategoryFormatPipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return 'Không có danh mục';
    
    return value
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}