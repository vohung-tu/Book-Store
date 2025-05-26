import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../model/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private baseUrl = 'http://localhost:3000/reviews'; // Backend NestJS endpoint

  constructor(private http: HttpClient) {}

  submitReview(review: Review): Observable<Review> {
    return this.http.post<Review>(this.baseUrl, review);
  }

  getReviews(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}?productId=${productId}`);
  }

  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.baseUrl);
  }
}
