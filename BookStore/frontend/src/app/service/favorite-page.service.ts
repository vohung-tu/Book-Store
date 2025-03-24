import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BookDetails } from '../model/books-details.model';

@Injectable({
  providedIn: 'root'
})
export class FavoritePageService {
  private favorites: BookDetails[] = []; // Danh sách sản phẩm yêu thích
  private favoriteSubject = new BehaviorSubject<BookDetails[]>([]);

  favorites$ = this.favoriteSubject.asObservable(); // Observable cho component lắng nghe

  constructor() { }

  addToFavorites(book: BookDetails): void {
    const existingBook = this.favorites.find(item => item._id === book._id);
    if (!existingBook) {
      this.favorites.push(book);
      this.favoriteSubject.next([...this.favorites]);
    }
  }

  removeFromFavorites(bookId: string): void {
    this.favorites = this.favorites.filter(book => book._id !== bookId);
    this.favoriteSubject.next([...this.favorites]);
  }

  getFavorites(): BookDetails[] {
    return this.favorites;
  }
}
