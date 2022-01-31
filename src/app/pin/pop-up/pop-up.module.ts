import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopUpComponent } from './pop-up.component';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider'

@NgModule({
  declarations: [
    PopUpComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule
  ],
  exports: [
    MatCardModule,
    PopUpComponent,
    MatDividerModule
  ]
})
export class PopUpModule { }
