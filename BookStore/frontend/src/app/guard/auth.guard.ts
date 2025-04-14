import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';


@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const isLoggedIn = this.authService.isLoggedIn(); // Kiểm tra token hoặc trạng thái đăng nhập

    if (!isLoggedIn) {
      this.router.navigate(['/signin'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    const roles = next.data['roles'] as Array<string>; // Lấy roles từ data
    const userRole = this.authService.getUserRole(); // Lấy role hiện tại từ token/localStorage

    if (roles && !roles.includes(userRole)) {
      this.router.navigate(['/unauthorized']); // Trang báo lỗi
      return false;
    }

    return true;
  }
}
