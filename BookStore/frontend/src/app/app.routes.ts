import { Routes } from '@angular/router';
import { HomepageComponent } from './component/homepage/homepage.component';
import { SignupComponent } from './component/signup/signup.component';
import { SigninComponent } from './component/signin/signin.component';
import { DetailComponent } from './component/detail/detail.component';
import { CartComponent } from './component/cart/cart.component';
import { UserInfoComponent } from './component/user-info/user-info.component';
import { FavoritePageComponent } from './component/favorite-page/favorite-page.component';
import { ContactComponent } from './component/contact/contact.component';
import { CategoryComponent } from './component/category/category.component';
import { CheckoutComponent } from './component/checkout/checkout.component';
import { AuthGuard } from './guard/auth.guard';
import { LayoutComponent } from './admin/layout/layout.component';
import { AdminUserComponent } from './admin/admin-user/admin-user.component';
import { AdminProductComponent } from './admin/admin-product/admin-product.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminOrderComponent } from './admin/admin-order/admin-order.component';
import { LayoutUserComponent } from './component/user-info/layout-user/layout-user.component';
import { VnpayReturnComponent } from './component/checkout/vnpay-return/vnpay-return.component';
import { AdminAuthorComponent } from './admin/admin-author/admin-author.component';
import { AuthorDetailsComponent } from './component/author-details/author-details.component';
import { UserOrderComponent } from './component/user-info/user-order/user-order.component';
import { AddressBookComponent } from './component/user-info/address-book/address-book.component';
import { ResetPasswordComponent } from './component/user-info/reset-password/reset-password.component';
import { ForgotPasswordComponent } from './component/forgot-password/forgot-password.component';
import { ResetPasswordLinkComponent } from './component/reset-password-link/reset-password-link.component';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./component/homepage/homepage.module').then(m => m.HomepageModule)
  },
  {
    path: '', 
    redirectTo: '/home', 
    pathMatch: 'full' 
  },
  { 
    path: 'signup', 
    component: SignupComponent,
    title:'Sign Up' 
  }, // Trang đăng ký 
  { 
    path: 'signin', 
    component: SigninComponent,
    title:'Sign In' 
  }, // Trang đăng nhập
  {
    path: 'details/:id',
    component: DetailComponent,
    title: 'Book Detail'
  },
  {
    path: 'cart',
    component: CartComponent,
    title: 'Cart'
  },
  {
    path: 'user-info',
    component: UserInfoComponent,
    children: [
      { path: '', component: LayoutUserComponent }, // Mặc định hiện thông tin user
      { path: 'address-book', component: AddressBookComponent },
      { path: 'user-order', component: UserOrderComponent },
      { path: 'reset-pass', component: ResetPasswordComponent}
    ]
  },
  {
    path: 'wishlist',
    component: FavoritePageComponent,
    title: 'Sản phẩm yêu thích'
  },
  {
    path: 'contact',
    component: ContactComponent,
    title: 'Liên hệ chúng tôi'
  },
  { path: 'category/:categoryName', 
    component: CategoryComponent,
    title: 'Danh mục' 
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
    title: 'Thanh Toán'
  },
  {
    path: 'address-book',
    component: AddressBookComponent,
    title: 'Sổ địa chỉ'
  },
  { 
    path: 'forgot-password', 
    component: ForgotPasswordComponent,
    title: 'Quên MK' 
  },
  { 
    path: 'reset-password-link', 
    component: ResetPasswordLinkComponent,
    title: 'Reset Password ' 
  },
  { path: 'admin', 
    component: LayoutComponent, 
    canActivate: [AuthGuard], 
    data: { roles: ['admin'] },
    children: [
      {
        path: 'user',
        component: AdminUserComponent,
        title: 'Admin User'
      },
      {
        path: 'product',
        component: AdminProductComponent,
        title: 'Admin Product'
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        title: 'Admin Dashboard'
      },
      {
        path: 'order',
        component: AdminOrderComponent,
        title: 'Admin Order'
      },
      {
        path: 'author',
        component: AdminAuthorComponent,
        title: 'Admin Author'
      },
    ],
  },
  { path: 'search',
    loadComponent: () =>
      import('./component/search-page/search-page.component').then(m => m.SearchPageComponent)
  },
  { path: 'vnpay-return', component: VnpayReturnComponent },
  {
    path: 'author/:id', // id hoặc slug
    component: AuthorDetailsComponent
  }
];

export default routes;
