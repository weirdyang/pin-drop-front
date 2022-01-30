import { Component, OnInit } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MapService } from 'src/app/services/map.service';
import { IPin, IPinNew } from 'src/app/types/pin';
import { IErrorMessage } from 'src/app/types/http-error';
import { PinService } from 'src/app/services/pin.service';
import { InstantErrorStateMatcher } from 'src/app/core/validators';
@Component({
  selector: 'app-create-pin',
  templateUrl: './create-pin.component.html',
  styleUrls: ['./create-pin.component.scss']
})
export class CreatePinComponent {
  noteMatcher = new InstantErrorStateMatcher();
  pin?: IPinNew;
  form!: FormGroup;
  get password() {
    return this.form.get('key');
  }
  get username() {
    return this.form.get('username');
  }
  get minDate() {
    return new Date();
  }
  get maxDate() {
    return this.form.get('to')?.value;
  }
  hide = true;
  isSubmitting = false;
  constructor(
    private snackBar: MatSnackBar,
    private overlay: OverlayContainer,
    private pinService: PinService,
    private fb: FormBuilder,
    private mapService: MapService,
    public dialogRef: MatDialogRef<CreatePinComponent>) {
    const latLng = this.mapService.lastMarker.getLngLat();
    this.pin = {
      username: '',
      note: '',
      lat: latLng.lat,
      long: latLng.lng,
      key: '',
      to: new Date(new Date().getFullYear() + 1, 0, 1),
      from: new Date()
    }
    this.form = this.fb.group({
      username: [this.pin?.username, [Validators.required]],
      key: [this.pin?.key, [Validators.required]],
      lat: this.pin.lat,
      long: this.pin.long,
      to: new Date(new Date().getFullYear() + 1, 0, 1),
      from: new Date(),
      note: [this.pin.note, [Validators.maxLength(140)]]
    })
  }
  submit() {
    this.isSubmitting = true;
    this.pinService.createPin(this.form.value)
      .subscribe({
        next: response => {
          this.snackBar.open('Pin created!')
          this.mapService.lastMarker.remove();
          this.mapService.getMarkers();

          this.dialogRef.close();
        },
        error: err => {

          this.isSubmitting = false;
          const { error } = err;

          let errorMessage = '';
          if (error.message) {
            errorMessage += error.message;
          }
          if (error.additionalInfo && error.additionalInfo.length) {
            console.error(error);
            error.additionalInfo.forEach((element: IErrorMessage) => {
              errorMessage += `\n${element.error}`;
            });
          }
          if (errorMessage.trim().length === 0) {
            errorMessage = 'This is unexpected, please contact support'
          }
          this.snackBar.open(errorMessage, 'OK')
        }
      })
  }
  dismiss() {
    this.dialogRef.close();
  }

}
