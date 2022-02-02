import { Injectable } from '@angular/core';
import { mapboxToken } from '../config';
import MapboxGeocoder, { Result } from '@mapbox/mapbox-gl-geocoder';
import mapboxgl, { GeoJSONSource, Point } from 'mapbox-gl';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreatePinComponent } from '../pin/create-pin/create-pin.component';
import { BehaviorSubject, combineLatest, of, Subject, Subscription } from 'rxjs';
import { PinService } from './pin.service';
import { IPinData } from '../types/pin';
import * as GeoJSON from 'geojson'
import { DynamicComponentService } from './dynamic-component.service';
import { PopUpComponent } from '../pin/pop-up/pop-up.component';
import { catchError, filter, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class MapService {
  constructor(
    public dialog: MatDialog,
    private snack: MatSnackBar,
    private pinService: PinService,
    private dynamic: DynamicComponentService) {

  }
  map!: mapboxgl.Map;
  initialZoom = 3;
  geocoder!: MapboxGeocoder;
  localSearch!: MapboxGeocoder;
  dialogSubscription?: Subscription;
  lastMarker: mapboxgl.Marker = new mapboxgl.Marker();

  private readySubject = new BehaviorSubject<boolean>(false);

  ready$ = this.readySubject.asObservable().pipe(shareReplay(1));

  private setUpSubject = new Subject<boolean>();
  setUp$ = this.setUpSubject.asObservable()
    .pipe(shareReplay(1));

  private geoJsonSubject = new BehaviorSubject<GeoJSON.FeatureCollection<GeoJSON.Geometry>>({
    type: 'FeatureCollection',
    features: [] as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]
  })
  geoJson$ = this.geoJsonSubject.asObservable()
    .pipe(
      shareReplay(1),
      catchError(err => of({} as GeoJSON.FeatureCollection<GeoJSON.Geometry>))
    )

  private updateSubject = new BehaviorSubject<boolean>(false);
  update$ = this.updateSubject.asObservable().pipe(shareReplay(1));
  updateData(update: boolean) {
    this.updateSubject.next(update);
  }
  refreshData$ = this.update$.pipe(
    filter(x => x === true),
    tap(x => console.log('update', x)),
    switchMap(() =>
      this.markers$.pipe(
        tap((data) => {
          const source = this.map.getSource('locations') as GeoJSONSource;
          source.setData(data);
          console.log(data, 'update');
          this.refreshLocalSearch();
        })
      )
    ));
  addGeocoder() {
    const map = this.map;
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxToken,
      mapboxgl: map,
      marker: false,
      flyTo: {
        speed: 0.8,
        curve: 1,
        padding: 15, // If you want some minimum space around your result
        easing: function (t) {
          return t;
        },
        maxZoom: 10, // If you want your result not to go further than a specific zoom
      }
    });
    this.map.addControl(geocoder, "top-right");
    //set up draggable to respond to geocoder search
    geocoder.on("result", ev => {
      const resultLon = ev.result.geometry.coordinates[0];
      const resultLat = ev.result.geometry.coordinates[1];
      this.lastMarker.setLngLat([resultLon, resultLat]);
      this.lastMarker.addTo(this.map);
      this.lastMarker.getElement().addEventListener('click', () => {
        this.openPinForm()
      })
    });
    this.geocoder = geocoder;
  }


  markers$ = this.pinService.pins$
    .pipe(map(data => {
      console.log(data, 'markers');
      const geoJson = {
        type: 'FeatureCollection',
        features: [] as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]
      } as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
      for (let point of data as IPinData[]) {
        let coordinate = [point.long, point.lat];
        if (point.lat > 90 || point.lat < -90) {
          continue;
        }
        let feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: coordinate
          },
          properties: point
        } as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
        geoJson.features.push(
          feature as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>);
      }
      console.log(data, 'after process')
      this.geoJsonSubject.next(geoJson);
      return geoJson
    }))

  closePopUps() {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    /** Check if there is already a popup on the map and if so, remove it */
    if (popUps[0]) popUps[0].remove();
  };

  openPinForm() {
    const dialogRef = this.dialog.open(CreatePinComponent, {
      width: '450px',
      disableClose: false,
    })
    this.dialogSubscription = dialogRef
      .afterClosed()
      .subscribe(result => {
        this.lastMarker.remove();
        this.map.zoomTo(6);
        if (result) {
          this.snack.open(result, 'OK');
        }
      });
  }

  createPopUp(currentFeature: any) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    /** Check if there is already a popup on the map and if so, remove it */
    if (popUps[0]) popUps[0].remove();
    const content = this.dynamic.injectComponent(PopUpComponent,
      x => x.model = currentFeature.properties as IPinData);
    new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(currentFeature.geometry.coordinates)
      .setDOMContent(content)
      .addTo(this.map);
  }
  // long, lat
  center: mapboxgl.LngLatLike = [73, 42];
  constructMap(divId: string = 'map', style = "mapbox://styles/mapbox/light-v10") {
    console.log('constructing map')
    this.map = new mapboxgl.Map({
      accessToken: mapboxToken,
      container: divId,
      style: style,
      center: this.center,
      zoom: this.initialZoom
    });

    this.map.on('load', (ev) => {
      this.setupMarkers();
      this.readySubject.next(true);
    });
  }
  setupMarkers() {
    this.map.on("click", "locations", (e: mapboxgl.EventData) => {
      let clickedPoint = e.features[0];
      this.createPopUp(clickedPoint);
    });
  }
  setUpMap$ = this.ready$
    .pipe(
      filter(ready => ready === true),
      switchMap(ready =>
        this.markers$.pipe(
          tap(x => console.log(x)),
          tap(x => this.addLayerAndSources(x)),
          tap(_ => this.addGeocoder()),
          tap(x => this.addLocalSearch(x)),
          tap(_ => this.setupMarkers()),
          tap(_ => this.setUpSubject.next(true))
        )
      )
    )
  addLayerAndSources(geoJson: GeoJSON.FeatureCollection<GeoJSON.Geometry>) {
    this.map.addSource("locations", { type: "geojson", data: geoJson });
    this.map.addLayer({
      id: "singles",
      // type: "symbol",
      type: "circle",
      source: "locations",
      paint: {
        'circle-radius': {
          'base': 1.75,
          'stops': [[12, 15], [22, 180]]
        },
        'circle-color': ' #91c949',
        'circle-opacity': 0.5,
      }
    });

    this.map.addLayer({
      id: 'locations',
      type: 'symbol',
      source: 'locations',
      layout: {
        'text-variable-anchor': ['center', 'bottom', 'top', 'left', 'left'],
        'text-justify': 'auto',
        'text-radial-offset': 0.25,
        'text-field': [
          'format',
          ['get', 'username'],
          {
            "font-scale": 0.8
          }
        ],
      }
    });

    this.map.addLayer({
      id: 'results',
      type: 'circle',
      source: 'locations',
      paint: {
        'circle-radius': 12,
        'circle-color': '#ff0003'
      },
      filter: ['in', 'username', '']
    }, 'singles');
  }

  resetMap() {
    this.map.flyTo({
      center: this.center,
      zoom: this.initialZoom
    });
  }

  refreshLocalSearch() {
    this.map.removeControl(this.localSearch);
    this.addLocalSearch(this.geoJsonSubject.value);
  }

  // Because features come from tiled vector data,
  // feature geometries may be split
  // or duplicated across tile boundaries.
  // As a result, features may appear
  // multiple times in query results.
  getUniqueFeatures(
    features: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[],
    comparatorProperty: string) {
    const uniqueIds = new Set();
    const uniqueFeatures = [];
    for (const feature of features) {
      if (!feature.properties) {
        break;
      }
      const id = feature.properties[comparatorProperty];
      if (!uniqueIds.has(id)) {
        uniqueIds.add(id);
        uniqueFeatures.push(feature);
      }
    }
    return uniqueFeatures;
  }
  addLocalSearch(data: GeoJSON.FeatureCollection<GeoJSON.Geometry>) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };

    function forwardGeocoder(query: string) {
      console.log(query)
      const matchingFeatures = [] as Result[];
      const uniqueNames: string[] = [];
      for (const feature of data.features) {
        let current = feature.properties?.username.toLowerCase();
        if (uniqueNames.find(x => x.toLowerCase() === current)) {
          continue
        }
        if (current.includes(query.toLowerCase())) {
          const result = feature as Result;
          // https://github.com/mapbox/carmen/blob/master/carmen-geojson.md
          result['place_name'] = `${feature.properties?.username}`;
          const point = feature.geometry as GeoJSON.Point;
          result['center'] = point.coordinates;
          result['place_type'] = ['user'];
          matchingFeatures.push(result);
          uniqueNames.push(current);

        }
      }
      return matchingFeatures;
    }
    const map = this.map;
    this.localSearch = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      localGeocoder: forwardGeocoder,
      zoom: 14,
      placeholder: 'Search for username',
      mapboxgl: map,
      localGeocoderOnly: true,
      marker: false,
      flyTo: false
    });
    // Add the control to the map.
    this.map.addControl(
      this.localSearch,
      'bottom-right'
    );
    this.localSearch.on('clear', () => {
      this.resetMap();
      this.map.setFilter('results',
        [
          'in', 'username', ''

        ])
    })
    this.localSearch.on('result', (ev) => {
      this.map.setFilter('results', ['in', 'username', '']);
      const { result } = ev;
      this.map.setFilter('results',
        [
          'in', 'username', result.properties.username
        ])

      const source = this.map.getSource('locations');
      console.log(source);
      const userLocations = this.geoJsonSubject.value.features
        .filter(y => y.properties?.username === result.properties.username)
        .map(x => {
          const point = x.geometry as GeoJSON.Point;
          return point.coordinates;
        });
      // alternative using querySourceFeatures
      // const test = this.map.querySourceFeatures('locations', {
      //   filter: ['in', 'username', result.properties.username]
      // })
      // const unique = this.getUniqueFeatures(test, '_id');
      // //
      // console.log(test);
      const start = userLocations[0];
      if (userLocations.length > 1) {
        const startLngLat = new mapboxgl.LngLat(start[0], start[1]);

        const bounds = new mapboxgl.LngLatBounds(
          startLngLat,
          startLngLat
        );
        for (const feat of userLocations) {
          let coord = new mapboxgl.LngLat(feat[0], feat[1]);
          bounds.extend(coord);
        }

        this.map.fitBounds(bounds, {
          padding: 20
        })
      } else {
        this.map.flyTo({
          center: [start[0], start[1]],
          zoom: 15
        });
      }

    })

  }
}
