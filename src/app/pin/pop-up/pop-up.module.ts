import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopUpComponent } from './pop-up.component';

@NgModule({
  declarations: [
    PopUpComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PopUpComponent,
  ]
})
export class PopUpModule { }
