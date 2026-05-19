import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { VehicleResult } from '../interfaces/automation.interface';

interface SwissCarInfoItem {
  identification: {
    make: string;
    commercial_name: string;
    type_approval: string;
    date_of_approval?: string;
  };
  engine?: {
    power_kw?: number;
    power_hp?: number;
  };
  fuel?: {
    type_label?: string;
  };
  _source?: string;
  _generation?: number;
}

interface SwissCarInfoResponse {
  success: boolean;
  data: SwissCarInfoItem[];
  meta?: {
    total: number;
    page: number;
  };
}

export interface VehicleSearchResult {
  results: VehicleResult[];
  total: number;
}

interface SwissCarInfoMatriculeData {
  identification: {
    make: string;
    commercial_name: string;
    type_approval: string;
    registration_number?: string;
    date_of_approval?: string;
  };
  engine?: { power_kw?: number; power_hp?: number };
  fuel?: { type_label?: string };
}

interface SwissCarInfoMatriculeResponse {
  success: boolean;
  data: SwissCarInfoMatriculeData[];
}



@Injectable({ providedIn: 'root' })
export class SwissCarInfoService {
  private readonly apiUrl = environment.swissCarInfoApiUrl;
  private readonly apiKey = environment.swissCarInfoApiKey;

  constructor(private readonly http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'X-API-Key': this.apiKey });
  }

  searchBrands(query: string, lang: string = 'de'): Observable<string[]> {
    if (!query.trim()) return of([]);
    const params = new HttpParams()
      .set('q', query.trim())
      .set('type', 'brand_model')
      .set('lang', lang)
      .set('limit', '30');
    return this.http
      .get<SwissCarInfoResponse>(`${this.apiUrl}/search`, { headers: this.headers, params })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) return [];
          const seen = new Set<string>();
          const brands: string[] = [];
          for (const item of res.data) {
            const make = item.identification?.make;
            if (make && !seen.has(make)) { seen.add(make); brands.push(make); }
          }
          return brands.sort();
        }),
        catchError((err) => {
          console.error('SwissCarInfo searchBrands error:', err);
          return of([]);
        })
      );
  }

  searchVehicles(
    brandQuery: string,
    modelQuery: string,
    page: number,
    perPage: number,
    lang: string = 'de'
  ): Observable<VehicleSearchResult> {
    const q = [brandQuery.trim(), modelQuery.trim()].filter(Boolean).join(' ');
    if (!q) return of({ results: [], total: 0 });

    const params = new HttpParams()
      .set('q', q)
      .set('type', 'brand_model')
      .set('lang', lang)
      .set('limit', String(perPage))
      .set('page', String(page));

    return this.http
      .get<SwissCarInfoResponse>(`${this.apiUrl}/search`, { headers: this.headers, params })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) return { results: [], total: 0 };
          const results: VehicleResult[] = res.data.map((item) => ({
            make: item.identification?.make ?? '',
            commercial_name: item.identification?.commercial_name ?? '',
            type_approval: item.identification?.type_approval ?? '',
            fuel_type: item.fuel?.type_label,
            power_kw: item.engine?.power_kw,
            power_hp: item.engine?.power_hp,
            date_of_approval: item.identification?.date_of_approval,
            source: item._generation != null ? `TAS Gen${item._generation}` : item._source,
          }));
          return { results, total: res.meta?.total ?? results.length };
        }),
        catchError((err) => {
          console.error('SwissCarInfo searchVehicles error:', err);
          return of({ results: [], total: 0 });
        })
      );
  }

  searchByTypeApproval(
    query: string,
    page: number,
    perPage: number,
    lang: string = 'de'
  ): Observable<VehicleSearchResult> {
    if (!query.trim()) return of({ results: [], total: 0 });
    const params = new HttpParams()
      .set('q', query.trim())
      .set('type', 'variant')
      .set('lang', lang)
      .set('limit', String(perPage))
      .set('page', String(page));
    return this.http
      .get<SwissCarInfoResponse>(`${this.apiUrl}/search`, { headers: this.headers, params })
      .pipe(
        map((res) => {
          if (!res.success || !res.data) return { results: [], total: 0 };
          const results: VehicleResult[] = res.data.map((item) => ({
            make: item.identification?.make ?? '',
            commercial_name: item.identification?.commercial_name ?? '',
            type_approval: item.identification?.type_approval ?? '',
            fuel_type: item.fuel?.type_label,
            power_kw: item.engine?.power_kw,
            power_hp: item.engine?.power_hp,
            date_of_approval: item.identification?.date_of_approval,
            source: item._generation != null ? `TAS Gen${item._generation}` : item._source,
          }));
          return { results, total: res.meta?.total ?? results.length };
        }),
        catchError((err) => {
          console.error('SwissCarInfo searchByTypeApproval error:', err);
          return of({ results: [], total: 0 });
        })
      );
  }

  searchBySerial(serial: string, lang: string = 'de'): Observable<VehicleResult | null> {
    const params = new HttpParams()
      .set('q', serial.trim())
      .set('type', 'matricule')
      .set('lang', lang);
    return this.http
      .get<SwissCarInfoMatriculeResponse>(`${this.apiUrl}/search`, { headers: this.headers, params })
      .pipe(
        map((res) => {
          if (!res.success || !res.data || res.data.length === 0) return null;
          const item = res.data[0];
          return {
            make: item.identification?.make ?? '',
            commercial_name: item.identification?.commercial_name ?? '',
            type_approval: item.identification?.type_approval ?? '',
            fuel_type: item.fuel?.type_label,
            power_kw: item.engine?.power_kw,
            power_hp: item.engine?.power_hp,
            date_of_approval: item.identification?.date_of_approval,
            source: 'matricule',
          } as VehicleResult;
        }),
        catchError((err) => {
          console.error('SwissCarInfo searchBySerial error:', err);
          return of(null);
        })
      );
  }
}
