import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CardModule,
    ChartModule,
    ProgressBarModule,
    CommonModule
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent {
  products = [
    { name: 'Space T-Shirt', category: 'Clothing', percentage: 50, color: 'orange-bar', colorHex: '#f97316' },
    { name: 'Portal Sticker', category: 'Accessories', percentage: 16, color: 'cyan-bar', colorHex: '#06b6d4' },
    { name: 'Supernova Sticker', category: 'Accessories', percentage: 67, color: 'pink-bar', colorHex: '#ec4899' },
    { name: 'Wonders Notebook', category: 'Office', percentage: 35, color: 'green-bar', colorHex: '#22c55e' },
    { name: 'Mat Black Case', category: 'Accessories', percentage: 75, color: 'purple-bar', colorHex: '#a855f7' },
    { name: 'Robots T-Shirt', category: 'Clothing', percentage: 40, color: 'teal-bar', colorHex: '#14b8a6' },
  ];
  constructor() {}

}
