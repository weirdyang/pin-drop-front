import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MapService } from '../services/map.service';
import { IPinData } from '../types/pin';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  readySubscription!: Subscription;
  refreshSubscription!: Subscription;
  mapContainerId = 'map'
  mapStyle = 'mapbox://styles/mapbox/light-v10'
  constructor(
    private mapService: MapService
  ) { }

  protected readonly destroy$ = new Subject();
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {

    this.mapService.updateSettings(
      this.mapContainerId,
      this.mapStyle
    );
    this.readySubscription =
      this.mapService.createMap$.pipe(
        takeUntil(this.destroy$)
      ).subscribe();
    this.refreshSubscription =
      this.mapService.refreshData$.pipe(
        takeUntil(this.destroy$)
      ).subscribe();

    this.mapService.spiders$.subscribe(
      ([geo, data]) => {
        this.mapService.constructSpiders(data as IPinData[]);
      }
    )
  }

}
