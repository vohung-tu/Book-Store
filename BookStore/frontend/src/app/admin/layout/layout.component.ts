import { Component, Renderer2, ViewChild } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { LayoutService } from '../../service/layout.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    TopBarComponent,
    SidebarComponent,
    RouterModule,
    FooterComponent,
    CommonModule

  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  overlayMenuOpenSubscription: Subscription;

  menuOutsideClickListener: any;
  sidebarVisible = false;

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  @ViewChild(SidebarComponent) appSidebar!: SidebarComponent;

  @ViewChild(TopBarComponent) appTopBar!: TopBarComponent;
  constructor(
    public layoutService: LayoutService,
    public renderer: Renderer2,
    public router: Router
) {
    
    this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
        if (!this.menuOutsideClickListener) {
            this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
                if (this.isOutsideClicked(event)) {
                    this.hideMenu();
                }
            });
        }

        if (this.layoutService.layoutState().staticMenuMobileActive) {
            this.blockBodyScroll();
        }
    });

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
        this.hideMenu();
    });
  }
  

  isOutsideClicked(event: MouseEvent) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarEl = document.querySelector('.layout-menu-button');
    const eventTarget = event.target as Node;

    return !(sidebarEl?.isSameNode(eventTarget) || sidebarEl?.contains(eventTarget) || topbarEl?.isSameNode(eventTarget) || topbarEl?.contains(eventTarget));
  }

  hideMenu() {
      this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
      if (this.menuOutsideClickListener) {
          this.menuOutsideClickListener();
          this.menuOutsideClickListener = null;
      }
      this.unblockBodyScroll();
  }

  blockBodyScroll(): void {
      if (document.body.classList) {
          document.body.classList.add('blocked-scroll');
      } else {
          document.body.className += ' blocked-scroll';
      }
  }

  unblockBodyScroll(): void {
      if (document.body.classList) {
          document.body.classList.remove('blocked-scroll');
      } else {
          document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
      }
  }

  get containerClass() {
      return {
          'layout-overlay': this.layoutService.layoutConfig().menuMode === 'overlay',
          'layout-static': this.layoutService.layoutConfig().menuMode === 'static',
          'layout-static-inactive': this.layoutService.layoutState().staticMenuDesktopInactive && this.layoutService.layoutConfig().menuMode === 'static',
          'layout-overlay-active': this.layoutService.layoutState().overlayMenuActive,
          'layout-mobile-active': this.layoutService.layoutState().staticMenuMobileActive
      };
  }

  ngOnDestroy() {
      if (this.overlayMenuOpenSubscription) {
          this.overlayMenuOpenSubscription.unsubscribe();
      }

      if (this.menuOutsideClickListener) {
          this.menuOutsideClickListener();
      }
  }
}
