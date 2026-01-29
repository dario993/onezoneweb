import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, Observable, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class OneZoneService {
  constructor(private readonly http: HttpClient) {}

  public banner(): Observable<unknown> {
    return this.http
      .get(`https://onezone.ch/wp-json/wp/v2/banner`, {
        responseType: "json",
      })
      .pipe(
        map((data: any): any => data),
        catchError((_error: HttpErrorResponse): any => of({}))
      );
  }
}
