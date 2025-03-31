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

const routes: Routes = [
  { 
    path: 'home', 
    component: HomepageComponent 
  }, // Trang chủ
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
    path: 'userInfo',
    component: UserInfoComponent,
    title: 'User Detail'
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
  }
];

export default routes;
