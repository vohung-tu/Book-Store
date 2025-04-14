import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-address-book',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule
  ],
  templateUrl: './address-book.component.html',
  styleUrl: './address-book.component.scss'
})
export class AddressBookComponent implements OnInit {
  addresses: string[] = [
    '123 Đường ABC, Quận 1, TP.HCM',
    '456 Đường XYZ, Quận 3, TP.HCM',
    '789 Đường LMN, Quận 5, TP.HCM'
  ];


  currentUser: any = null;  // Chứa thông tin người dùng

  constructor(private authService: AuthService,) {}

  ngOnInit(): void {
    // this.authService.getUserInfo().subscribe(
    //   (data) => {
    //     this.currentUser = data;  // Lưu thông tin người dùng vào biến
    //   },
    //   (error) => {
    //     console.error('Error fetching user info:', error);
    //   }
    // );
  }
  addAddress() {
    const newAddress = prompt("Nhập địa chỉ mới:");
    if (newAddress) {
      this.addresses.push(newAddress);
    }
  }
}
