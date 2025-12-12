import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-payos-return',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './payos-return.component.html',
  styleUrls: ['./payos-return.component.scss']
})
export class payOSReturnComponent implements OnInit {
  orderCode?: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.orderCode = this.route.snapshot.queryParamMap.get('orderCode') ?? '';
  }
}
