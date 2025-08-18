import { Category } from "../../model/books-details.model";

export function isCategory(x: unknown): x is Category {
  return !!x && typeof x === 'object' && 'slug' in (x as any) && 'name' in (x as any);
}
export function catSlug(c: string | Category): string {
  return isCategory(c) ? c.slug : c;
}
export function catName(c: string | Category): string {
  return isCategory(c) ? c.name : (
    c.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
  );
}
