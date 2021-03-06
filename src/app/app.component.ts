import { Component, OnInit } from '@angular/core';
import { MapService } from './services/map.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'pin-drop-front';


  constructor(private mapService: MapService) { }
  resetMap() {
    this.mapService.resetMap();
  }

  ngOnInit(): void {
    console.log('in init')

  }
}
