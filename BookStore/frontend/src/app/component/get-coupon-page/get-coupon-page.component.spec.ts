import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetCouponPageComponent } from './get-coupon-page.component';

describe('GetCouponPageComponent', () => {
  let component: GetCouponPageComponent;
  let fixture: ComponentFixture<GetCouponPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetCouponPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetCouponPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
