import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthorService } from '../../service/author.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { Author } from '../../model/author.model';

@Component({
  selector: 'app-author-details',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    CommonModule
  ],
  templateUrl: './author-details.component.html',
  styleUrls: ['./author-details.component.scss']
})
export class AuthorDetailsComponent implements OnInit {
  authorId!: string;
  author: any;

  constructor(private route: ActivatedRoute, private authorService: AuthorService) {}

  ngOnInit() {
    this.authorId = this.route.snapshot.paramMap.get('id')!;
    this.authorService.getAuthorById(this.authorId).subscribe((res) => {
      this.author = res;
    });
  }

  loadAuthor(id: string) {
    this.authorService.getAuthorById(id).subscribe({
      next: (data: Author) => {
        this.author = data;
      },
      error: (err) => {
        console.error('Failed to load author', err);
      }
    });
  }
}
