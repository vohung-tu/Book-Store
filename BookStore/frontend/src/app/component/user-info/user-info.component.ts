import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { User } from '../../model/users-details.model';
import { SidebarUserComponent } from './sidebar-user/sidebar-user.component';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [
    CardModule,
    CommonModule,
    ButtonModule,
    RouterModule,
    SidebarUserComponent
  ],
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit{
  currentUser: User | null = null;

  constructor(
   
  ) {}

  ngOnInit(): void {
  }

}
