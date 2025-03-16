import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { HomepageComponent } from './component/homepage/homepage.component';
import { SignupComponent } from './component/signup/signup.component';

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
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
