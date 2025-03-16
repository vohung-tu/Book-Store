import { Routes } from '@angular/router';
import { HomepageComponent } from './component/homepage/homepage.component';
import { SignupComponent } from './component/signup/signup.component';
import { SigninComponent } from './component/signin/signin.component';
import { DetailComponent } from './component/detail/detail.component';
import { CartComponent } from './component/cart/cart.component';
import { UserInfoComponent } from './component/user-info/user-info.component';

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
  }
];

export default routes;
