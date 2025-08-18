import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomepageComponent } from './homepage.component';

const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    title: 'PamTech - Nơi ươm mầm giấc mơ'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomepageRoutingModule {}
