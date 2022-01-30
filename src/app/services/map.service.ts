import { Injectable } from '@angular/core';
import { mapboxToken } from '../config';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import mapboxgl, { ExpressionSpecification, GeoJSONSource, StyleFunction } from 'mapbox-gl';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreatePinComponent } from '../pin/create-pin/create-pin.component';
import { Subscription } from 'rxjs';
import { PinService } from './pin.service';
import { IPinData } from '../types/pin';
import * as GeoJSON from 'geojson'
@Injectable({
  providedIn: 'root'
})
export class MapService {
  map!: mapboxgl.Map;

  geocoder!: MapboxGeocoder;
  dialogSubscription?: Subscription;
  lastMarker: mapboxgl.Marker = new mapboxgl.Marker();

  addGeocoder() {
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxToken,
      mapboxgl: this.map as mapboxgl.Map,
      marker: false
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
  geoJson: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
    type: 'FeatureCollection',
    features: [] as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]
  }

  getMarkers() {
    this.pinService.getPins()
      .subscribe(data => {
        //console.log(data);
        for (let point of data as IPinData[]) {
          let coordinate = [point.long, point.lat];
          let feature = {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: coordinate
            },
            properties: point
          } as GeoJSON.Feature<GeoJSON.Geometry>;
          this.geoJson.features.push(feature as GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>);
        }
        const source = this.map.getSource('locations') as GeoJSONSource;
        source.setData(this.geoJson);
        console.log(this.geoJson);
      })
  }
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
        if (result) {
          this.snack.open(result, 'OK');
        }
      });
  }
  addMarker() {
    console.log(this.map);
    const el = document.createElement("div");
    el.className = "marker";
    new mapboxgl.Marker()
      .setLngLat(this.center)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML( // add popups
          `
      <h3>Find us here!</h3>
      <h4>
MacRitchie Nature Trail & Reservoir Park<br/>
MacRitchie Reservoir Park <br/>Singapore 298717
      </h4>`)
      )
      .addTo(this.map);
  }

  constructor(
    public dialog: MatDialog,
    private snack: MatSnackBar,
    private pinService: PinService) {

  }
  formatDate(date: string) {
    return new Date(date).toISOString().split('T')[0];
  }
  constructPopup(point: IPinData) {
    return `
    <h3>${point.username}</h3>
    <span>From: ${this.formatDate(point.from.toString())}</span>
    <span>To: ${this.formatDate(point.to.toString())}</span>
    ${point.note ? this.formatNote(point.note) : ''}
    <span class="footer">Added on ${this.formatDate(point.updatedAt.toString())}</span>
    `
  }
  formatNote(note: string) {
    return `
      <span>Note</span>
      <span class="note">
      ${note}
      </span>
    `
  }
  createPopUp(currentFeature: any) {
    var popUps = document.getElementsByClassName('mapboxgl-popup');
    /** Check if there is already a popup on the map and if so, remove it */
    if (popUps[0]) popUps[0].remove();

    var popup = new mapboxgl.Popup({ closeOnClick: true })
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML(this.constructPopup(currentFeature.properties as IPinData))
      .addTo(this.map);
  }
  // long, lat
  center: mapboxgl.LngLatLike = [73, 42];
  constructMap() {
    this.map = new mapboxgl.Map({
      accessToken: mapboxToken,
      container: 'map',
      style: "mapbox://styles/mapbox/light-v10",
      center: this.center,
      zoom: 3
    });
    this.map.on('load', () => {

      this.addLayerAndSources();
      this.setupMarkers();
    });
  }
  setupMarkers() {
    this.getMarkers();
    this.map.on("click", "locations", (e: mapboxgl.EventData) => {
      let clickedPoint = e.features[0];
      this.createPopUp(clickedPoint);
    });
  }
  addLayerAndSources() {
    this.map.addSource("locations", { type: "geojson", data: this.geoJson });
    this.map.addLayer({
      id: "singles",
      // type: "symbol",
      type: "circle",
      source: "locations",
      paint: {
        'circle-radius': {
          'base': 5,
          'stops': [[5, 10], [15, 250]]
        },
        'circle-color': ' #91c949',
        'circle-opacity': 0.75,
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
  }

  returnName(item: any) {
    return item.properties.username
  }
  flyToStore() {
    this.map.flyTo({
      center: this.center,
      zoom: 15
    });
  }
}
