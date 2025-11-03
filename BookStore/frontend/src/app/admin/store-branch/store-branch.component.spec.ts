import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoreBranchComponent } from './store-branch.component';

describe('StoreBranchComponent', () => {
  let component: StoreBranchComponent;
  let fixture: ComponentFixture<StoreBranchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoreBranchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoreBranchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
