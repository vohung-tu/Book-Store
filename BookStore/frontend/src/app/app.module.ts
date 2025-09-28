import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomepageComponent } from './component/homepage/homepage.component';
import { NavbarModule } from './component/navbar/navbar.module';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { SignupComponent } from './component/signup/signup.component';
import { NavbarComponent } from './component/navbar/navbar.component';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { SigninComponent } from './component/signin/signin.component';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import Swiper from 'swiper';
import { provideHttpClient } from '@angular/common/http';
import { BooksService } from './service/books.service';
import { MessageService } from 'primeng/api';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ToastModule } from 'primeng/toast';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent, 
    HomepageComponent,
    NavbarComponent,
    SignupComponent,
    SigninComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    NavbarModule,
    MatMenuModule,
    MatButtonModule,
    RouterModule,
    ReactiveFormsModule, //sử dụng reactive form để tạo form trang đăng ký/đăng nhập
    MatFormFieldModule,   // Material Form Field
    MatInputModule,
    Swiper,
    ToastModule,
    MatDatepickerModule,
    MatNativeDateModule,
    BrowserAnimationsModule
  ],
  providers: [
    BooksService,
    provideHttpClient(),
    MessageService,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
})
export class AppModule { }
