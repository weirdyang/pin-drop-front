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
import { HttpErrorResponse } from '@angular/common/http';
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
    return new Date(new Date().toDateString());
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
      from: this.minDate
    }
    this.form = this.fb.group({
      username: [this.pin?.username, [Validators.required]],
      key: [this.pin?.key, [Validators.required]],
      lat: this.pin.lat,
      long: this.pin.long,
      to: this.pin.to,
      from: this.pin.from,
      note: [this.pin.note, [Validators.maxLength(140)]]
    })
  }
  submit() {
    this.isSubmitting = true;
    console.log(this.form.value);

    this.pinService.createPin(this.form.value)
      .subscribe({
        next: response => {
          this.dialogRef.close();
          this.snackBar.open('Pin created!')
          this.mapService.lastMarker.remove();
          this.mapService.updateData(true);

        },
        error: (err: HttpErrorResponse) => {

          this.isSubmitting = false;
          const { error } = err;
          let errorMessage = '';
          if (error instanceof ErrorEvent) {
            errorMessage = 'Please try submitting again';
          }
          else {
            errorMessage = error.message;
          }
          this.snackBar.open(errorMessage, 'OK')
        }
      })
  }
  dismiss() {
    this.dialogRef.close();
  }

}
