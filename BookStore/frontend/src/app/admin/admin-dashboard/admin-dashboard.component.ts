import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../service/order.service';
import { AuthService } from '../../service/auth.service';
import { ReviewService } from '../../service/review.service';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { DotSeparatorPipe } from '../../pipes/dot-separator.pipe';
import { Order, Product } from '../../model/order.model';
import { Category } from '../../model/books-details.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    TableModule,
    DotSeparatorPipe
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  /** KPI data */
  totalOrders = 0;
  totalUsers = 0;
  totalRevenue = 0;
  totalComments = 0;

  /** Chart data */
  revenueChartData: any;
  revenueChartOptions: any;
  orderStatusChartData: any;
  orderStatusChartOptions: any;
  categoryChartData: any;
  categoryChartOptions: any;
  userGrowthChartData: any;
  chartOptions: any;

  /** Table data */
  topBooks: any[] = [];
  topCustomers: any[] = [];

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private reviewService: ReviewService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadUsers();
    this.loadReviews();

    this.chartOptions = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    };
  }

  /** === Load orders & calculate charts === */
  loadOrders() {
    this.orderService.getOrders().subscribe((orders: Order[]) => {
      this.totalOrders = orders.length;
      this.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

      const monthlyData: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      const bookSales: Record<string, { title: string; coverImage: string; sold: number; revenue: number }> = {};
      const categoryRevenue: Record<string, number> = {};

      const customerMap: Record<string, { name: string; orderCount: number; totalSpent: number }> = {};

      orders.forEach(order => {
        // Doanh thu theo tháng
        const month = new Date(order.orderDate).toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + order.total;

        // Đếm trạng thái đơn hàng
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

        // Gom top khách hàng (tính cả đơn completed + shipping)
        if (!customerMap[order.userId]) {
          customerMap[order.userId] = { name: order.name || 'Khách hàng', orderCount: 0, totalSpent: 0 };
        }
        customerMap[order.userId].orderCount++;
        customerMap[order.userId].totalSpent += order.total;

        // Tính top sách & doanh thu theo danh mục
        order.products.forEach((product: Product) => {
          if (!bookSales[product._id]) {
            bookSales[product._id] = {
              title: product.title,
              coverImage: product.coverImage,
              sold: 0,
              revenue: 0
            };
          }
          bookSales[product._id].sold += product.quantity;
          bookSales[product._id].revenue += product.price * product.quantity;

          const catName = (product as any)?.categoryName?.name ?? (product as any)?.categoryName ?? 'Khác';
          categoryRevenue[catName] = (categoryRevenue[catName] || 0) + product.price * product.quantity;
        });
      });

      // Line Chart Doanh thu theo tháng
      this.revenueChartData = {
        labels: Object.keys(monthlyData),
        datasets: [{
          label: 'Doanh thu',
          data: Object.values(monthlyData),
          fill: true,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          tension: 0.4
        }]
      };

      // Doughnut Chart trạng thái đơn hàng
      this.orderStatusChartData = {
        labels: Object.keys(statusCounts),
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350']
        }]
      };

      // Table Top sách bán chạy
      this.topBooks = Object.values(bookSales).sort((a, b) => b.sold - a.sold).slice(0, 5);

      // Bar Chart Doanh thu theo danh mục
      this.categoryChartData = {
        labels: Object.keys(categoryRevenue),
        datasets: [{ label: 'Doanh thu', data: Object.values(categoryRevenue), backgroundColor: '#42A5F5', borderRadius: 6 }]
      };

      // Top Khách Hàng
      this.topCustomers = Object.values(customerMap)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
    });
  }

  /** === Load users & calculate growth chart === */
  loadUsers() {
    this.authService.getUsers().subscribe(users => {
      this.totalUsers = users.length;

      const monthlyCounts: Record<string, number> = {};
      users.forEach(u => {
        if (!u.createdAt) return;
        const month = new Date(u.createdAt).toLocaleString('default', { month: 'short' });
        monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
      });

      this.userGrowthChartData = {
        labels: Object.keys(monthlyCounts),
        datasets: [{
          label: 'Người dùng mới',
          data: Object.values(monthlyCounts),
          backgroundColor: 'rgba(116, 201, 11, 0.7)',
          borderRadius: 6
        }]
      };
    });
  }

  /** === Load reviews count === */
  loadReviews() {
    this.reviewService.getAllReviews().subscribe(reviews => this.totalComments = reviews.length);
  }
}
