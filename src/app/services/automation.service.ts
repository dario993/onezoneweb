import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import {
  CheckLoginResponse,
  ConsultantItem,
  PatchConsultantPayload,
  ConsultantRegistrationPayload,
  ConsultantRegistrationResponse,
  CredentialsUpdateResponse,
  EcoHubSetupPayload,
  ExtractTotpPayload,
  ExtractTotpResponse,
  GenerateQuotesResponse,
  GetConsultantResponse,
  LocalityEntry,
  QuoteRequestPayload,
  QuoteRequestStatus,
  StreetEntry,
} from '../interfaces/automation.interface';

const OPENPLZ_STREETS_URL = 'https://openplzapi.org/ch/Streets';
const OPENPLZ_STREET_NAME_RE = /^[\p{L}\d\s.\-']+$/u;
const PUBLIC_CONSULTANT_ID = 'sys:public_web';

@Injectable({ providedIn: 'root' })
export class AutomationService {
  private baseUrl = environment.automationApiEndpoint;
  private adminApiKey = environment.automationAdminApiKey;
  private localities: LocalityEntry[] = [];
  private localitiesLoaded = false;

  constructor(
    private readonly http: HttpClient,
    private readonly storageService: StorageService
  ) {
    this.loadLocalities();
  }

  private loadLocalities(): void {
    this.http.get('assets/data/AMTOVZ_CSV_LV95.csv', { responseType: 'text' }).subscribe({
      next: (csv) => {
        const lines = csv.split('\n');
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(';');
          this.localities.push({
            locality: cols[0],
            plz: cols[1],
            canton: cols[6],
          });
        }
        this.localitiesLoaded = true;
      },
      error: (err) => console.error('Errore caricamento CSV località:', err),
    });
  }

  public getLocalitiesByPlz(plz: string): LocalityEntry[] {
    return this.localities.filter((l) => l.plz === plz);
  }

  public searchByPlz(plz: string): LocalityEntry[] {
    return this.localities.filter((l) => l.plz.startsWith(plz));
  }

  public isLocalitiesLoaded(): boolean {
    return this.localitiesLoaded;
  }

  private get adminHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.adminApiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    });
  }

  private buildBearerHeaders(apiKey: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    });
  }

  private get consultantHeaders(): HttpHeaders {
    const apiKey = this.storageService.getItem('consultantApiKey');
    if (!apiKey) {
      throw new Error('Consultant API key not found. Please complete the setup first.');
    }
    return new HttpHeaders({
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'ngrok-skip-browser-warning': 'true',
    });
  }

  public registerConsultant(
    payload: ConsultantRegistrationPayload
  ): Observable<ConsultantRegistrationResponse> {
    return this.http
      .post<ConsultantRegistrationResponse>(
        `${this.baseUrl}/consultants`,
        payload,
        { headers: this.adminHeaders }
      )
      .pipe(
        tap((res) => this.storageService.setItem('consultantApiKey', res.api_key))
      );
  }

  public getConsultant(onezoneId: string): Observable<GetConsultantResponse> {
    return this.http
      .get<GetConsultantResponse>(
        `${this.baseUrl}/consultants/${onezoneId}`,
        { headers: this.adminHeaders }
      )
      .pipe(
        tap((res) => this.storageService.setItem('consultantApiKey', res.api_key))
      );
  }

  public getPublicConsultant(): Observable<GetConsultantResponse> {
    return this.http
      .get<GetConsultantResponse>(
        `${this.baseUrl}/consultants/${PUBLIC_CONSULTANT_ID}`,
        { headers: this.adminHeaders }
      )
      .pipe(
        tap((res) => this.storageService.setItem('publicConsultantApiKey', res.api_key))
      );
  }

  public ensurePublicApiKey(): Observable<string> {
    const cached = this.storageService.getItem('publicConsultantApiKey');
    if (cached) return of(cached);
    return this.getPublicConsultant().pipe(map((res) => res.api_key));
  }

  public checkLogin(consultantId: string): Observable<CheckLoginResponse> {
    return this.http.post<CheckLoginResponse>(
      `${this.baseUrl}/consultants/${consultantId}/verify-login`,
      {},
      { headers: this.adminHeaders }
    );
  }

  public extractTotp(
    payload: ExtractTotpPayload
  ): Observable<ExtractTotpResponse> {
    const formData = new FormData();
    formData.append('qr_image', payload.qr_image);
    return this.http.post<ExtractTotpResponse>(
      `${this.baseUrl}/extract-totp-secret`,
      formData,
      { headers: new HttpHeaders({ Authorization: `Bearer ${this.adminApiKey}`, Accept: 'application/json', 'ngrok-skip-browser-warning': 'true' }) }
    );
  }

  public updateConsultant(payload: EcoHubSetupPayload): Observable<CredentialsUpdateResponse> {
    const { consultant_id, ...credentials } = payload;
    return this.http.post<CredentialsUpdateResponse>(
      `${this.baseUrl}/consultants/${consultant_id}/credentials`,
      credentials,
      { headers: this.adminHeaders }
    );
  }

  public submitQuoteRequest(
    payload: QuoteRequestPayload,
    usePublicConsultant = false
  ): Observable<GenerateQuotesResponse> {
    if (usePublicConsultant) {
      return this.ensurePublicApiKey().pipe(
        switchMap((apiKey) =>
          this.http.post<GenerateQuotesResponse>(
            `${this.baseUrl}/generate-quotes`,
            payload,
            { headers: this.buildBearerHeaders(apiKey) }
          )
        )
      );
    }
    return this.http.post<GenerateQuotesResponse>(
      `${this.baseUrl}/generate-quotes`,
      payload,
      { headers: this.consultantHeaders }
    );
  }

  public getQuoteRequestStatus(
    requestId: number,
    usePublicConsultant = false
  ): Observable<QuoteRequestStatus> {
    return this.http.get<QuoteRequestStatus>(
      `${this.baseUrl}/quote-requests/${requestId}`,
      { headers: usePublicConsultant ? this.adminHeaders : this.consultantHeaders }
    );
  }

  public patchConsultant(id: number, payload: PatchConsultantPayload): Observable<ConsultantItem> {
    return this.http.patch<ConsultantItem>(
      `${this.baseUrl}/consultants/${id}`,
      payload,
      { headers: this.adminHeaders }
    );
  }

  public getConsultants(): Observable<ConsultantItem[]> {
    return this.http.get<ConsultantItem[]>(
      `${this.baseUrl}/consultants`,
      { headers: this.adminHeaders }
    );
  }

  public hasConsultantApiKey(): boolean {
    return !!this.storageService.getItem('consultantApiKey');
  }

  public searchStreets(
    name: string,
    postalCode: string,
    locality: string
  ): Observable<StreetEntry[]> {
    const trimmed = (name || '').trim();
    if (!trimmed || !OPENPLZ_STREET_NAME_RE.test(trimmed)) return of([]);
    const params = new URLSearchParams({
      name: trimmed,
      postalCode,
      locality,
      page: '1',
      pageSize: '20',
    });
    return this.http
      .get<Array<{ name: string; postalCode: string; locality: string; canton?: { key?: string } }>>(
        `${OPENPLZ_STREETS_URL}?${params.toString()}`
      )
      .pipe(
        map((arr) =>
          (arr || []).map((s) => ({
            name: s.name,
            postalCode: s.postalCode,
            locality: s.locality,
            canton: s.canton?.key || '',
          }))
        ),
        catchError(() => of([] as StreetEntry[]))
      );
  }
}
