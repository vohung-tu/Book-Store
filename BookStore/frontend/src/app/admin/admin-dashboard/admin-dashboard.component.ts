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
import { CategoryService } from '../../service/category.service';
import { forkJoin } from 'rxjs';

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
  userMap: Record<string, string> = {};
  /** Table data */
  topBooks: any[] = [];
  topCustomers: any[] = [];
  categoryMap = new Map<string, Category>();

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private reviewService: ReviewService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    /** Chart options dùng chung */
    this.chartOptions = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    };

    /**
     * 1️⃣ Load USERS + REVIEWS + CATEGORIES song song
     * (3 API này không phụ thuộc nhau)
     */
    forkJoin({
      users: this.authService.getUsers(),
      reviews: this.reviewService.getAllReviews(),
      categories: this.categoryService.getCategories()
    }).subscribe({
      next: ({ users, reviews, categories }) => {
        /** USERS */
        this.totalUsers = users.length;
        this.buildUserGrowthChart(users);

        /** REVIEWS */
        this.totalComments = reviews.length;

        /** CATEGORIES */
        this.categoryMap = new Map(categories.map(c => [c._id, c]));

        /**
         * 2️⃣ Sau khi có category → mới load ORDERS
         */
        // this.loadOrders();
      },
      error: err => {
        console.error('Dashboard init error', err);
      }
    });
  }

  private buildUserGrowthChart(users: any[]) {
  const monthlyCounts: Record<string, number> = {};

  users.forEach(u => {
    if (!u.createdAt) return;
    const month = new Date(u.createdAt).toLocaleString('default', { month: 'short' });
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
  });

  this.userGrowthChartData = {
    labels: Object.keys(monthlyCounts),
    datasets: [
      {
        label: 'Người dùng mới',
        data: Object.values(monthlyCounts),
        backgroundColor: 'rgba(116, 201, 11, 0.7)',
        borderRadius: 6
      }
    ]
  };
}

  /** === Load orders & calculate charts === */
  loadOrders() {
    this.orderService.getOrders().subscribe((orders: Order[]) => {
      // Tổng số đơn hàng
      this.totalOrders = orders.length;

      // Chỉ tính doanh thu từ đơn đã hoàn thành
      const completedOrders = orders.filter(o => o.status === 'completed');
      this.totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

      /** Dữ liệu cho các biểu đồ và bảng */
      const monthlyData: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      const bookSales: Record<string, { title: string; coverImage: string; sold: number; revenue: number }> = {};
      const categoryRevenue: Record<string, number> = {};
      const customerMap: Record<string, { name: string; orderCount: number; totalSpent: number }> = {};

      // ✅ Lặp qua tất cả đơn hàng
      orders.forEach(order => {
        // Đếm trạng thái đơn hàng (hiển thị biểu đồ tròn)
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

        // Chỉ tính chi tiết cho đơn completed
        if (order.status !== 'completed') return;

        // Doanh thu theo tháng
        const month = new Date(order.orderDate).toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + order.total;

        // Top khách hàng
        const userName =
          this.userMap[order.userId] ||
          order.email ||
          'Khách hàng';

        if (!customerMap[order.userId]) {
          customerMap[order.userId] = {
            name: userName,
            orderCount: 0,
            totalSpent: 0
          };
        }

        customerMap[order.userId].orderCount++;
        customerMap[order.userId].totalSpent += order.total;

        // Tính top sách & doanh thu theo danh mục
        order.products.forEach((product: Product) => {
          // Top sách
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

          // Tên danh mục (ưu tiên lấy từ category.name)
          const catRaw = (product as any)?.categoryId || (product as any)?.category;
          const catId = typeof catRaw === 'object' ? catRaw?._id?.toString() : catRaw?.toString?.();

          const rawCategory =
            this.categoryMap.get(catId) ??
            (product as any)?.category?.name ??
            (product as any)?.categoryName ??
            (product as any)?.category?.slug ??
            'Khác';

          const catName =
            typeof rawCategory === 'string'
              ? rawCategory
              : rawCategory?.name || 'Khác';



          categoryRevenue[catName] =
            (categoryRevenue[catName] || 0) + product.price * product.quantity;
        });
      });

      /** === BIỂU ĐỒ DOANH THU THEO THÁNG === */
      this.revenueChartData = {
        labels: Object.keys(monthlyData),
        datasets: [
          {
            label: 'Doanh thu',
            data: Object.values(monthlyData),
            fill: true,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            tension: 0.4
          }
        ]
      };

      /** === BIỂU ĐỒ TRẠNG THÁI ĐƠN HÀNG === */
      const statusLabels: Record<string, string> = {
        pending_payment: 'Chờ xử lý',
        processing: 'Đang xử lý',
        shipping: 'Đang giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
        returned: 'Đã trả hàng'
      };

      this.orderStatusChartData = {
        labels: Object.keys(statusCounts).map(k => statusLabels[k] || k),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#2E7D32', '#EF5350', '#AB47BC']
          }
        ]
      };

      /** === TOP SÁCH BÁN CHẠY === */
      this.topBooks = Object.values(bookSales)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      /** === BIỂU ĐỒ DOANH THU THEO DANH MỤC === */
      this.categoryChartData = {
        labels: Object.keys(categoryRevenue),
        datasets: [
          {
            label: 'Doanh thu theo danh mục',
            data: Object.values(categoryRevenue),
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#EC407A', '#26C6DA'],
            borderRadius: 6
          }
        ]
      };

      /** === TOP KHÁCH HÀNG === */
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
