import { Component, OnInit } from '@angular/core';
import { IPinData } from 'src/app/types/pin';

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.scss']
})
export class PopUpComponent {
  model!: IPinData
  constructor() { }
  formatDate(date: string) {
    return new Date(date).toISOString().split('T')[0];
  }
  get from() {
    return this.formatDate(this.model.from.toString());
  }
  get to() {
    return this.formatDate(this.model.to.toString());
  }
  get created() {
    return this.formatDate(this.model.updatedAt.toString());
  }
}
