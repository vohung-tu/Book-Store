import { RenderMode, ServerRoute } from '@angular/ssr';
import { authorId, bookId } from '../../routes-ids';
const categoryNames = ['sach-trong-nuoc', 'manga', 'vpp-dung-cu-hoc-sinh', 'do-choi', 'lam-dep', 'sach-tham-khao', 'sach-ngoai-van'];

export const serverRoutes: ServerRoute[] = [
  { 
    path: 'category/:categoryName', 
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return categoryNames.map(categoryName => ({ categoryName }));
    },
  },
  { 
    path: 'details/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const ids = bookId;
      return ids.map(id => ({ id }));
    },
  },
  { 
    path: 'author/:id', 
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const ids = authorId;
      return ids.map(id => ({ id }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
