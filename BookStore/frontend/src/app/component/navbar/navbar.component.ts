import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../service/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, interval, Observable, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CartService } from '../../service/cart.service';
import { BookDetails, Category } from '../../model/books-details.model';
import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { BooksService } from '../../service/books.service';
import { MegaMenuItem, MessageService } from 'primeng/api';
import { CategoryService } from '../../service/category.service';
import { MegaMenu, MegaMenuModule } from 'primeng/megamenu';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { NotificationService } from '../../service/notification.service';
import { UserNotification } from '../../model/notification.model';
import { ClickOutsideDirective } from '../../shared/directives/click-outside.directive';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: true,
  imports: [
    NgIf,
    MatMenuModule, 
    MatButtonModule,
    MatFormFieldModule, 
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    CommonModule, 
    RouterModule,
    BadgeModule,
    OverlayBadgeModule,
    ButtonModule,
    FormsModule,
    MegaMenuModule,
    DialogModule,
    ToastModule,
    ClickOutsideDirective
  ],
  styleUrls: ['./navbar.component.scss'],
  providers: [MessageService]
})
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('megaMenu') megaMenu!: MegaMenu;
  isLoggedIn$!: Observable<boolean>;
  isLoading$!: Observable<boolean>;
  cartItemCount: number = 0;
  private destroy$ = new Subject<void>();
  cart$: Observable<BookDetails[]>;
  currentUser: any;
  userRole: string | null = null;
  searchTerm = '';
  showMenu = false;
  showSuggestions = false;
  suggestions: any[] = [];
  filteredSuggestions: string[] = [];
  items: MegaMenuItem[] = [];
  private searchSubject = new Subject<string>();
  activeCategory: Category | null = null;
  categories: Category[] = [];
  currentLocationAddr: string | null = null;
  locationText: string | null = null;
  locationDialogVisible = false;
  addressList: any[] = [];
  selectedAddress: any;
  notifications: UserNotification[] = [];
  unreadCount = 0;
  showNotiDropdown = false;
  private pollingSub?: Subscription;
  isLoadingNoti = false;

  constructor(private authService: AuthService,
    private cartService: CartService,
    private bookService: BooksService,
    private router: Router,
    private categoryService: CategoryService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private messageService: MessageService,
  private zone: NgZone
  ) {
    this.cart$ = this.cartService.getCart();
    this.searchSubject.pipe(debounceTime(300)).subscribe((term) => {
      this.fetchSuggestions(term);
    });
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cart) => {
          this.cartItemCount = cart.reduce(
            (sum, item) => sum + (item.quantity || 1),
            0
          );
        },
        error: () => {
          this.cartItemCount = 0;
        }
      });

    this.authService.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        this.userRole = user?.role || null;

        this.resolveLocationDisplay(user);

        if (user?._id) {
          this.authService.getAddresses(user._id).subscribe(res => {
            this.addressList = res.address || [];
          });
        }
      });

    this.getCurrentUser();

    this.categoryService.getTree().subscribe(cats => {
      this.categories = cats;
    });

    const savedAddress = sessionStorage.getItem('selectedAddress');
    if (savedAddress) {
      this.locationText = savedAddress;
    } else {
      this.getUserLocation();
    }

    this.loadNotifications();

    this.pollingSub = interval(30000)
      .pipe(
        switchMap(() => this.notificationService.getMyNotifications(20)),
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.notifications = data as any;
        this.updateUnreadCount();
      });
  }

  goToNotificationPage(event: Event) {
    event.stopPropagation(); 
    this.showNotiDropdown = false; 
    this.router.navigate(['/user-info/notification']);
  }

  signout(): void {
    this.authService.signout();
    this.notifications = [];
    this.unreadCount = 0;
    this.showNotiDropdown = false;
  }

  changeLanguage(lang: string) {
    console.log('Selected language:', lang);
  }

  getUserLocation() {
    if (!navigator.geolocation) {
      this.locationText = 'Không xác định được vị trí';
      return;
    }

    console.log('🧭 Gọi getUserLocation() khi chưa login');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        this.http
          .get(`https://nominatim.openstreetmap.org/reverse`, {
            params: {
              format: 'json',
              lat: latitude,
              lon: longitude,
              addressdetails: '1'
            },
            headers: { 'Accept-Language': 'vi' }
          })
          .subscribe({
            next: (res: any) => {
              const address = res.address;
              const district = address.suburb || address.city_district || '';
              const ward = address.quarter || address.village || '';
              const city = address.city || address.state || address.county || '';

              const text = `${district ? 'Q. ' + district + ', ' : ''}${ward ? 'P. ' + ward + ', ' : ''}${city}`;

              // 🔥 Cập nhật trong Angular zone để UI nhận thay đổi
              this.zone.run(() => {
                this.locationText = text;
                console.log('📍 Địa chỉ GPS hiển thị:', this.locationText);
              });
            },
            error: (err) => {
              console.error('Lỗi lấy vị trí:', err);
              this.zone.run(() => {
                this.locationText = 'Không xác định được vị trí';
              });
            }
          });
      },
      (err) => {
        console.warn('Người dùng từ chối chia sẻ vị trí:', err);
        this.zone.run(() => {
          this.locationText = 'Chưa chọn địa chỉ giao hàng';
        });
      }
    );
  }
  getCurrentUser(): void {
    if (typeof window === 'undefined') return; 
    const token = localStorage.getItem('token');
    if (!token) return;
    
    this.authService.getProfile().subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
        } else {
          console.error('Không thể lấy thông tin người dùng');
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin người dùng', err);
      }
    });
  }

  private resolveLocationDisplay(user: any) {
    const savedAddress = sessionStorage.getItem('selectedAddress');

    // Ưu tiên địa chỉ đã chọn
    if (savedAddress) {
      this.locationText = savedAddress;
      return;
    }

    // Chưa login → dùng GPS
    if (!user) {
      this.getUserLocation();
      return;
    }

    // Login nhưng chưa có địa chỉ → GPS
    this.getUserLocation();
  }

  confirmAddress() {
    this.locationText = this.selectedAddress.value;
    sessionStorage.setItem('selectedAddress', this.selectedAddress.value);
    if (!this.currentUser?._id || !this.selectedAddress) {
      this.messageService.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng chọn địa chỉ!' });
      return;
    }

    const exists = this.addressList.some(a => a.value === this.selectedAddress.value);
    if (!exists) {
      this.addressList.push(this.selectedAddress);
    }

    this.addressList = this.addressList.map(addr => ({
      ...addr,
      isDefault: addr.value === this.selectedAddress.value
    }));

    this.locationText = this.selectedAddress.value;

    this.authService.updateAddress(this.currentUser._id, this.addressList).subscribe({
      next: (updatedUser) => {
        this.locationDialogVisible = false;
        this.authService.setCurrentUser(updatedUser);

        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã chọn địa chỉ giao hàng mới!',
        });
      },
      error: (err) => {
        console.error('❌ Lỗi khi cập nhật địa chỉ:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật địa chỉ. Vui lòng thử lại.',
        });
      }
    });
  }


  showLocationDialog() {
    if (!this.currentUser?._id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Đăng nhập',
        detail: 'Vui lòng đăng nhập để chọn địa chỉ giao hàng!',
      });
      return;
    }

    this.locationDialogVisible = true;
    this.authService.getAddresses(this.currentUser._id).subscribe({
      next: (res: any) => {
        this.addressList = res.address || [];
        if (this.addressList.length > 0) {
          const defaultAddr = this.addressList.find(a => a.isDefault) || this.addressList[0];
          this.selectedAddress = defaultAddr;
        }
      },
      error: (err) => {
        console.error('❌ Lỗi khi tải danh sách địa chỉ:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi tải dữ liệu',
          detail: 'Không thể tải danh sách địa chỉ!',
        });
        this.addressList = [];
      }
    });

  }

  onInputChange() {
    this.searchSubject.next(this.searchTerm);
  }

  fetchSuggestions(term: string) {
    if (!term.trim()) {
      this.suggestions = [];
      return;
    }

    this.bookService.searchBooks(term).subscribe({
      next: (res) => (this.suggestions = res),
      error: () => (this.suggestions = []),
    });
  }


  selectSuggestion(suggestion: BookDetails) {
    this.searchTerm = suggestion.title;
    this.suggestions = [];
    this.onSearch(); // Gọi luôn tìm kiếm nếu muốn
  }

  hideSuggestions() {
    this.suggestions = [];
  }

  onSearch() {
    console.log('Tìm kiếm:', this.searchTerm);
    if (this.searchTerm.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { keyword: this.searchTerm.trim() }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadNotifications(): void {
    this.isLoadingNoti = true;
    this.notificationService.getMyNotifications(20).subscribe({
      next: (data) => {
        this.notifications = data as any;
        this.updateUnreadCount();
        this.isLoadingNoti = false;
      },
      error: () => {
        this.isLoadingNoti = false;
      },
    });
  }

  loadUnreadCountOnly(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (res) => (this.unreadCount = res.count),
    });
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter((n) => !n.isRead).length;
  }

  toggleNotiDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotiDropdown = !this.showNotiDropdown;

    // CHỈ load notification khi đã login
    if (this.showNotiDropdown && this.authService.isLoggedIn()) {
      if (this.notifications.length === 0) {
        this.loadNotifications();
      }
    }
  }

  goToLogin(event: MouseEvent) {
    event.stopPropagation();
    this.showNotiDropdown = false;
    this.router.navigate(['/signin']);
  }

  goToRegister(event: MouseEvent) {
    event.stopPropagation();
    this.showNotiDropdown = false;
    this.router.navigate(['/signup']);
  }

  onClickNotification(n: UserNotification, event: MouseEvent): void {
    event.stopPropagation();

    if (!n.isRead) {
      this.notificationService.markAsRead(n._id).subscribe({
        next: () => {
          n.isRead = true;
          this.updateUnreadCount();
        },
      });
    }
  }

  markAllAsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        this.updateUnreadCount();
      },
    });
  }

  navigateToCategory(slug: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation(); // tránh xung đột hover
    }
    window.location.href = `/category/${slug}`;
  }

  /** Convert category list thành MegaMenuItem[] */
  buildMenu(cats: any[]): MegaMenuItem[] {
    const parentCats = cats.filter(c => !c.parentId);
    return parentCats.map(parent => ({
      label: parent.name,
      routerLink: `/category/${parent.slug}`,
      items: parent.children?.length
        ? parent.children.map((child: any) => [
            {
              label: child.name,
              routerLink: `/category/${child.slug}`
            }
          ])
        : []
    }));
  }

}
