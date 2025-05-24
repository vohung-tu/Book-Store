import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dotSeparator',
  standalone: true
})
export class DotSeparatorPipe implements PipeTransform {
  transform(value: number | undefined): string {
    if (typeof value !== 'number') {
      return '0'; // hoặc trả về chuỗi trống '', hoặc '--'
    }
    return value.toLocaleString('de-DE');
  }
}
