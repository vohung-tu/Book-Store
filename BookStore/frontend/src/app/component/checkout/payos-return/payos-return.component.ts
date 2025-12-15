import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-payos-return',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './payos-return.component.html',
  styleUrls: ['./payos-return.component.scss']
})
export class payOSReturnComponent implements OnInit {
  orderCode?: string;

  constructor(private route: ActivatedRoute,
    private router: Router) {}

  ngOnInit() {
    this.orderCode = this.route.snapshot.queryParamMap.get('orderCode') ?? '';
  }
}
