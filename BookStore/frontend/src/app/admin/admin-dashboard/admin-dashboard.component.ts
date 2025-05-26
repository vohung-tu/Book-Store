import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { OrderService } from '../../service/order.service';
import { AuthService } from '../../service/auth.service';
import { ReviewService } from '../../service/review.service';

import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CardModule,
    ChartModule,
    ProgressBarModule,
    CommonModule,
    DotSeparatorPipe
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {

  totalOrders: number = 0;
  totalUsers: number = 0;
  totalRevenue: number = 0;
  totalComments: number = 0;
  monthlyRevenue: number[] = [];
  revenueChartData: any;
  revenueChartOptions: any;
  chart: any;
  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private reviewService: ReviewService
  ) {}
  ngOnInit(): void {
    this.orderService.getOrders().subscribe(orders => {
      this.totalOrders = orders.length;
      this.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      // Tạo dữ liệu doanh thu theo từng tháng
      const monthlyData: { [key: string]: number } = {};
      orders.forEach(order => {
        const month = new Date(order.orderDate).toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + order.total;
      });

      this.revenueChartData = {
        labels: Object.keys(monthlyData),
        datasets: [
          {
            label: 'Xu hướng doanh thu',
            data: Object.values(monthlyData),
            fill: true,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            tension: 0.4
          }
        ]
      };

      this.revenueChartOptions = {
        responsive: true,
        maintainAspectRatio: false
      };
    });

    this.authService.getTotalUsers().subscribe(total => {
      this.totalUsers = total;
    });
    
    this.reviewService.getAllReviews().subscribe(reviews => {
      this.totalComments = reviews.length;
    });
  }

}
