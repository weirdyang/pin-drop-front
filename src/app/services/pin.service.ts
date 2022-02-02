import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IPinData } from '../types/pin';

@Injectable({
  providedIn: 'root'
})
export class PinService {

  constructor(private http: HttpClient) { }

  apiUrl = environment.apiUrl;
  createPin(formData: FormData) {
    return this.http.post(`${this.apiUrl}/pin`, formData)
      .pipe(
        catchError(error => this.handleError(error))
      )
  }
  pins$ = this.http.get<IPinData[]>(`${this.apiUrl}/pin`)
    .pipe(
      catchError(error => this.handleError(error))
    )

  private handleError(err: HttpErrorResponse): Observable<never> {
    // in a real world app, we may send the server to some remote logging infrastructure
    // instead of just logging it to the console
    let errorMessage = '';
    if (err.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      errorMessage = `An error occurred: ${err.error.message}`;

    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    console.error(errorMessage)
    return throwError(err);
  }
}


