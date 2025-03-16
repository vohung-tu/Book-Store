import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../service/auth.service';
import { User } from '../../model/users-details.model';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [
    MatIconModule,
    MatCardModule,
    CommonModule,
    MatTableModule,
    ReactiveFormsModule,
    MatFormFieldModule
  ],
  templateUrl: './user-info.component.html',
  styleUrl: './user-info.component.scss'
})
export class UserInfoComponent implements OnInit{
  displayedColumns: string[] = ['username', 'full_name', 'birth', 'address', 'phone_number', 'email']
  dataSource: User[] = []; // Dữ liệu từ API
  profileForm!: FormGroup;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // this.authService.getUserInfo().subscribe((data) => {
    //   this.dataSource = data;
    // })
  }

 
}
