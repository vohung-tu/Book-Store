import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

interface FilterOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-filter-category',
  standalone: true,
  imports: [
    CommonModule,
    DropdownModule,
    FormsModule
  ],
  templateUrl: './filter-category.component.html',
  styleUrls: ['./filter-category.component.scss']
})
export class FilterCategoryComponent {
  @Output() priceFilter = new EventEmitter<string>();
  @Output() publisherFilter = new EventEmitter<string>();

  selectedPrice = '';
  selectedPublisher = '';
  
  priceOptions: FilterOption[] = [
    { label: 'Tất cả', value: '' },
    { label: 'Dưới 100.000 đ', value: 'low' },
    { label: '100.000 đ - 300.000 đ', value: 'medium' },
    { label: 'Trên 300.000 đ', value: 'high' },
  ];

  publishers: FilterOption[] = [
    { label: 'Tất cả', value: '' },
    { label: 'NXB Kim Đồng', value: 'NXB Kim Đồng' },
    { label: 'NXB Trẻ', value: 'NXB Trẻ' },
    { label: 'NXB Giáo Dục', value: 'NXB Giáo Dục' },
    { label: 'NXB Văn Học', value: 'NXB Văn Học' },
  ];

  onPriceChange(event: any) {
    const selected = event.value; // giá trị thực của option
    this.publisherFilter.emit(selected);
  }

  onPublisherChange(event: any) {
    this.priceFilter.emit(event.value);
  }
}
