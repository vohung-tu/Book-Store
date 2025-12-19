import { Component, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { NotificationService } from '../../../service/notification.service';
import { CommonModule } from '@angular/common';
import { UserNotification } from '../../../model/notification.model';
import { TabsModule } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    TabsModule,
    ProgressSpinnerModule
  ],
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
})
export class NotificationListComponent implements OnInit {
  notifications: UserNotification[] = [];
  filteredNotifications: UserNotification[] = [];
  loading = true;


  activeTab = 'all';

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    
    this.getNotifications();
  }

  getNotifications() {
    this.loading = true;
    this.notificationService.getMyNotifications().subscribe({
      next: (res: UserNotification[]) => {
        this.notifications = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getByType(type: string) {
    if (type === 'all') return this.notifications;

    if (type === 'order') {
      return this.notifications.filter(n =>
        n.type?.startsWith('order') 
      );
    }

    return this.notifications.filter(n => n.type === type);
  }

  goToDetail(id: string) {
    this.router.navigate(['/user-info/notifications', id]);
  }
}
