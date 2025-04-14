import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MenuItemComponent } from '../menu-item/menu-item.component';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    MenuItemComponent,  
    RouterModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  model: MenuItem[] = [];

  ngOnInit() {
    this.model = [
        {
            label: 'Home',
            items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }]
        },
        {
            label: 'UI Components',
            items: [
                { label: 'Form Layout', icon: 'pi pi-fw pi-id-card'},
                { label: 'Input', icon: 'pi pi-fw pi-check-square'},
                { label: 'Button', icon: 'pi pi-fw pi-mobile', class: 'rotated-icon' },
                { label: 'Table', icon: 'pi pi-fw pi-table' },
                { label: 'List', icon: 'pi pi-fw pi-list' },
                
            ]
        },
        {
            label: 'Pages',
            icon: 'pi pi-fw pi-briefcase',
            // routerLink: ['/pages'],
            items: [
                {
                    label: 'Landing',
                    icon: 'pi pi-fw pi-globe'
                    // routerLink: ['/landing']
                },
                {
                    label: 'Auth',
                    icon: 'pi pi-fw pi-user',
                    items: [
                        {
                            label: 'Login',
                            icon: 'pi pi-fw pi-sign-in'
                            // routerLink: ['/auth/login']
                        },
                        {
                            label: 'Error',
                            icon: 'pi pi-fw pi-times-circle'
                            // routerLink: ['/auth/error']
                        },
                        {
                            label: 'Access Denied',
                            icon: 'pi pi-fw pi-lock'
                            // routerLink: ['/auth/access']
                        }
                    ]
                },
                {
                    label: 'Crud',
                    icon: 'pi pi-fw pi-pencil'
                    // routerLink: ['/pages/crud']
                },
                {
                    label: 'Not Found',
                    icon: 'pi pi-fw pi-exclamation-circle'
                    // routerLink: ['/pages/notfound']
                },
                {
                    label: 'Empty',
                    icon: 'pi pi-fw pi-circle-off'
                    // routerLink: ['/pages/empty']
                }
            ]
        },
        {
            label: 'Hierarchy',
            items: [
                {
                    label: 'Submenu 1',
                    icon: 'pi pi-fw pi-bookmark',
                    items: [
                        {
                            label: 'Submenu 1.1',
                            icon: 'pi pi-fw pi-bookmark',
                            items: [
                                { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
                                { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
                                { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
                            ]
                        },
                        {
                            label: 'Submenu 1.2',
                            icon: 'pi pi-fw pi-bookmark',
                            items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
                        }
                    ]
                },
                {
                    label: 'Submenu 2',
                    icon: 'pi pi-fw pi-bookmark',
                    items: [
                        {
                            label: 'Submenu 2.1',
                            icon: 'pi pi-fw pi-bookmark',
                            items: [
                                { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
                                { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
                            ]
                        },
                        {
                            label: 'Submenu 2.2',
                            icon: 'pi pi-fw pi-bookmark',
                            items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
                        }
                    ]
                }
            ]
        },
        {
            label: 'Get Started',
            items: [
                {
                    label: 'Documentation',
                    icon: 'pi pi-fw pi-book',
                    // routerLink: ['/documentation']
                },
                {
                    label: 'View Source',
                    icon: 'pi pi-fw pi-github',
                    url: 'https://github.com/primefaces/sakai-ng',
                    target: '_blank'
                }
            ]
        }
    ];
}
}
