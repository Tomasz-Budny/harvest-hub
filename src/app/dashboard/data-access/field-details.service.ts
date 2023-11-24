import { Injectable } from '@angular/core';
import { FieldDetailsViewModel } from '../data-model/field-details.model';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OwnershipStatus } from '../data-model/ownership-status.model';
import { SoilClass } from '../data-model/soil-class.model';

@Injectable({
  providedIn: 'root'
})
export class FieldDetailsService {
  URL = 'https://localhost:7258/api/fields/'
  updateOwnerShipStatus$ = new Subject<{fieldId: string, ownershipStatus: OwnershipStatus}>()
  updateSoilClass$ = new Subject<{fieldId: string, soilClass: SoilClass}>();
  updateFieldName$ = new Subject<{fieldId: string, name: string}>();

  constructor(
    public http: HttpClient
  ) { 
    this.updateOwnerShipStatus$.pipe(
      takeUntilDestroyed(),
      switchMap(data => this.updateFieldOwnerShipStatus(data.fieldId, data.ownershipStatus).pipe(catchError(_ => EMPTY)))
    ).subscribe();

    this.updateSoilClass$.pipe(
      takeUntilDestroyed(),
      switchMap(data => this.updateFieldSoilClass(data.fieldId, data.soilClass).pipe(catchError(_ => EMPTY)))
    ).subscribe();

    this.updateFieldName$.pipe(
      takeUntilDestroyed(),
      switchMap(data => this.updateFieldName(data.fieldId, data.name).pipe(catchError(_ => EMPTY)))
    ).subscribe();
  }

  loadFieldDetails(fieldId: string) {
    return this.getFieldDetailsApi(fieldId);
  }

  private getFieldDetailsApi(fieldId: string) {
    return this.http.get<FieldDetailsViewModel>(this.URL + `${fieldId}/details`);
  }

  private updateFieldOwnerShipStatus(fieldId: string, ownershipStatus: OwnershipStatus) {
    return this.http.patch(this.URL + `${fieldId}/details`, {
      ownershipStatus: ownershipStatus
    });
  }

  private updateFieldSoilClass(fieldId: string, soilClass: SoilClass) {
    return this.http.patch(this.URL + `${fieldId}/details`, {
      class: soilClass
    });
  }

  private updateFieldName(fieldId: string, name: string) {
    return this.http.patch(this.URL + `${fieldId}/details`, {
      name: name
    });
  }
}
