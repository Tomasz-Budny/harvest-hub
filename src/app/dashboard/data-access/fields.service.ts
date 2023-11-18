import { Injectable, Signal, computed, signal } from '@angular/core';
import { FieldViewModel } from '../data-model/field.model';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HarvestHubResponse } from '../../shared/data-model/harvest-hub-response.model';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Subject, catchError, tap } from 'rxjs';
import { confirmDialog } from '../../shared/utils/confirm.operator';

@Injectable({
  providedIn: 'root'
})
export class FieldsService {
  URL = 'https://localhost:7258/api/fields';

  private state = signal<HarvestHubResponse<FieldViewModel[]>>({
    data: [],
    loaded: false,
    error: null
  });

  fieldsLoaded: Signal<boolean> = computed(() => this.state().loaded)
  remove$ = new Subject<string>();

  constructor(
    public http: HttpClient
  ) { 
    this.loadFields().subscribe({
      next: res => this.state.update(state => ({
        ...state,
        data: res,
        loaded: true
      })),
      error: err => this.state.update(state => ({
        ...state,
        error: err
      }))
    })

    this.remove$.asObservable().pipe(
      tap(fieldId => console.log(fieldId)),
      confirmDialog(fieldId => {
        return this.deleteFieldApi(fieldId)
        .pipe(
          catchError(_ => EMPTY)
        )
      })
    ).subscribe({
      next: fieldId => this.state.update(state => ({
        ...state,
        data: state.data.filter(field => field.id !== fieldId),
        loaded: true
      })),
      error: err => this.state.update(state => ({
        ...state,
        error: err
      }))
    })
  }

  getFields() {
    return this.state.asReadonly();
  }

  // deleteField(fieldId: string) {
  //   this.deleteFieldApi(fieldId).subscribe({
  //     next: _ => this.state.update(state => ({
  //       ...state,
  //       data: state.data.filter(field => field.id !== fieldId),
  //       loaded: true
  //     })),
  //     error: err => this.state.update(state => ({
  //       ...state,
  //       error: err
  //     }))
  //   })
  // }

  loadFields() {
    return this.http.get<FieldViewModel[]>(this.URL).pipe(
      takeUntilDestroyed()
    );
  }

  private deleteFieldApi(fieldId: string) {
    return this.http.delete(this.URL + `/${fieldId}`)
  }
}
