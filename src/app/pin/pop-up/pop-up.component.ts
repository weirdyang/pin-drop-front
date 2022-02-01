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
    return new Date(this.model.updatedAt).toDateString();
  }

  get start() {
    return new Date(this.model.from);
  }
  get end() {
    return new Date(this.model.to)
  }

  getDay(date: Date) {
    return date
      .toLocaleString('default', { day: 'numeric' })
      .padStart(2, '0')
  }
  getMonth(date: Date) {
    return date
      .toLocaleString('default', { month: 'short' })
  }
  getYear(date: Date) {
    return date
      .toLocaleString('default', { year: 'numeric' })
  }
}
