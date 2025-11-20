import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-address-dialog',
  templateUrl: './address-dialog.component.html',
  styleUrls: ['./address-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule
  ],
})
export class AddressDialogComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() addressList: any[] = [];
  @Input() currentLocationAddr?: string;
  @Input() selectedAddress: any;
  @Output() selectedAddressChange = new EventEmitter<any>();

  confirmAddress() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.selectedAddressChange.emit(this.selectedAddress);
  }
}
