import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { AutomationService } from '../../services/automation.service';
import { SwissCarInfoService } from '../../services/swiss-car-info.service';
import { ToasterService } from '../../services/toaster.service';
import { LoaderService } from '../../services/loader.service';
import { I18nService } from '../../services/i18n.service';
import { I18nFileService } from '../../services/i18nfile.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { LocalityEntry, StreetEntry, VehicleResult } from '../../interfaces/automation.interface';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StorageService } from '../../services/storage.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'page-automation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, I18nPipe],
  templateUrl: './automation-form.component.html',
})
export class AutomationFormComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  submitted = false;
  submitSuccess = false;
  submittedEmail = '';

  blockOfferModal = { open: false, items: [] as string[] };

  closeBlockOfferModal(): void {
    this.blockOfferModal = { open: false, items: [] };
  }

  // ─── Stato modale ricerca veicolo ───────────────────────────────────────────
  modal = {
    open: false,
    vehicleIndex: 1 as 1 | 2,
    typeApprovalQuery: '',
    brandQuery: '',
    modelQuery: '',
    serialQuery: '',
    results: [] as VehicleResult[],
    page: 1,
    total: 0,
    loading: false,
    searched: false,
    perPage: 10,
    lastSearchType: 'brand_model' as 'brand_model' | 'variant' | 'matricule',
  };

  get totalPages(): number {
    return Math.ceil(this.modal.total / this.modal.perPage);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.modal.page;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  openVehicleModal(vehicleIndex: 1 | 2): void {
    this.modal = {
      open: true,
      vehicleIndex,
      typeApprovalQuery: '',
      brandQuery: '',
      modelQuery: '',
      serialQuery: '',
      results: [],
      page: 1,
      total: 0,
      loading: false,
      searched: false,
      perPage: 10,
      lastSearchType: 'brand_model',
    };
    this.form.patchValue({
      [`car_brand_${vehicleIndex}`]: '',
      [`car_model_${vehicleIndex}`]: '',
      [`n_certificate_${vehicleIndex}`]: '',
      [`serial_number_${vehicleIndex}`]: '',
    });
  }

  closeVehicleModal(): void {
    this.modal.open = false;
  }

  onSearchVehicles(): void {
    const lang = this.i18nService.currentLanguage;
    const typeApproval = this.modal.typeApprovalQuery.trim();
    if (typeApproval) {
      this.modal.page = 1;
      this.modal.searched = true;
      this.modal.loading = true;
      this.modal.lastSearchType = 'variant';
      this.swissCarInfoService
        .searchByTypeApproval(typeApproval, 1, this.modal.perPage, lang)
        .subscribe(({ results, total }) => {
          this.modal.results = results;
          this.modal.total = total;
          this.modal.loading = false;
        });
      return;
    }
    const serial = this.modal.serialQuery.trim();
    if (serial) {
      this.modal.searched = true;
      this.modal.loading = true;
      this.modal.lastSearchType = 'matricule';
      this.swissCarInfoService.searchBySerial(serial, lang).subscribe((result) => {
        this.modal.loading = false;
        if (result) {
          this.modal.results = [result];
          this.modal.total = 1;
        } else {
          this.modal.results = [];
          this.modal.total = 0;
        }
      });
      return;
    }
    if (!this.modal.brandQuery.trim() && !this.modal.modelQuery.trim()) return;
    this.modal.page = 1;
    this.modal.searched = true;
    this.modal.loading = true;
    this.modal.lastSearchType = 'brand_model';
    this.swissCarInfoService
      .searchVehicles(this.modal.brandQuery, this.modal.modelQuery, 1, this.modal.perPage, lang)
      .subscribe(({ results, total }) => {
        this.modal.results = results;
        this.modal.total = total;
        this.modal.loading = false;
      });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.modal.page) return;
    this.modal.loading = true;
    const lang = this.i18nService.currentLanguage;
    const source$ = this.modal.lastSearchType === 'variant'
      ? this.swissCarInfoService.searchByTypeApproval(this.modal.typeApprovalQuery, page, this.modal.perPage, lang)
      : this.swissCarInfoService.searchVehicles(this.modal.brandQuery, this.modal.modelQuery, page, this.modal.perPage, lang);
    source$.subscribe(({ results, total }) => {
      this.modal.results = results;
      this.modal.total = total;
      this.modal.page = page;
      this.modal.loading = false;
    });
  }

  selectVehicleResult(result: VehicleResult): void {
    const N_CERT_RE = /^\d[A-Za-z]{2}\d{3}$/;
    const SERIAL_RE = /^\d{9}$/;
    const typeApproval = (result.type_approval ?? '').trim();
    const serial = this.modal.serialQuery?.trim() ?? '';
    const serialOk = SERIAL_RE.test(serial)
      && !this.obviousSerialValidator({ value: serial } as AbstractControl);

    this.form.patchValue({
      [`car_brand_${this.modal.vehicleIndex}`]: result.make,
      [`car_model_${this.modal.vehicleIndex}`]: result.commercial_name,
      [`n_certificate_${this.modal.vehicleIndex}`]: N_CERT_RE.test(typeApproval) ? typeApproval : '',
      ...(this.modal.lastSearchType === 'matricule'
        ? { [`serial_number_${this.modal.vehicleIndex}`]: serialOk ? serial : '' }
        : {}),
    });
    this.closeVehicleModal();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  // ─── Opzioni form ────────────────────────────────────────────────────────────
  genderOptions = ['Maschio', 'Femmina', 'Azienda'];
  languageOptions = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' },
  ];
  foreignersIdOptions = [
    { value: 'B', label: 'automation.opt_permit_B' },
    { value: 'C', label: 'automation.opt_permit_C' },
    { value: 'S', label: 'automation.opt_permit_S' },
    { value: 'Ci', label: 'automation.opt_permit_Ci' },
    { value: 'F', label: 'automation.opt_permit_F' },
    { value: 'G', label: 'automation.opt_permit_G' },
    { value: 'N', label: 'automation.opt_permit_N' },
  ];
  nationalityOptions = [
    { value: 'CH', label: 'Svizzera' },
    { value: 'DE', label: 'Germania' },
    { value: 'IT', label: 'Italia' },
    { value: 'FR', label: 'Francia' },
    { value: 'AF', label: 'Afghanistan' },
    { value: 'AL', label: 'Albania' },
    { value: 'DZ', label: 'Algeria' },
    { value: 'AD', label: 'Andorra' },
    { value: 'AO', label: 'Angola' },
    { value: 'AG', label: 'Antigua e Barbuda' },
    { value: 'AR', label: 'Argentina' },
    { value: 'AM', label: 'Armenia' },
    { value: 'AU', label: 'Australia' },
    { value: 'AT', label: 'Austria' },
    { value: 'AZ', label: 'Azerbaigian' },
    { value: 'BS', label: 'Bahamas' },
    { value: 'BH', label: 'Bahrein' },
    { value: 'BD', label: 'Bangladesh' },
    { value: 'BB', label: 'Barbados' },
    { value: 'BY', label: 'Bielorussia' },
    { value: 'BE', label: 'Belgio' },
    { value: 'BZ', label: 'Belize' },
    { value: 'BJ', label: 'Benin' },
    { value: 'BT', label: 'Bhutan' },
    { value: 'BO', label: 'Bolivia' },
    { value: 'BA', label: 'Bosnia ed Erzegovina' },
    { value: 'BW', label: 'Botswana' },
    { value: 'BR', label: 'Brasile' },
    { value: 'BN', label: 'Brunei' },
    { value: 'BG', label: 'Bulgaria' },
    { value: 'BF', label: 'Burkina Faso' },
    { value: 'BI', label: 'Burundi' },
    { value: 'KH', label: 'Cambogia' },
    { value: 'CM', label: 'Camerun' },
    { value: 'CA', label: 'Canada' },
    { value: 'CV', label: 'Capo Verde' },
    { value: 'TD', label: 'Ciad' },
    { value: 'CL', label: 'Cile' },
    { value: 'CN', label: 'Cina' },
    { value: 'CY', label: 'Cipro' },
    { value: 'CO', label: 'Colombia' },
    { value: 'KM', label: 'Comore' },
    { value: 'CG', label: 'Congo' },
    { value: 'CD', label: 'Congo, Repubblica Democratica' },
    { value: 'KP', label: 'Corea del Nord' },
    { value: 'KR', label: 'Corea del Sud' },
    { value: 'CI', label: "Costa d'Avorio" },
    { value: 'CR', label: 'Costa Rica' },
    { value: 'HR', label: 'Croazia' },
    { value: 'CU', label: 'Cuba' },
    { value: 'DK', label: 'Danimarca' },
    { value: 'DM', label: 'Dominica' },
    { value: 'DO', label: 'Repubblica Dominicana' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'EG', label: 'Egitto' },
    { value: 'SV', label: 'El Salvador' },
    { value: 'AE', label: 'Emirati Arabi Uniti' },
    { value: 'ER', label: 'Eritrea' },
    { value: 'EE', label: 'Estonia' },
    { value: 'ET', label: 'Etiopia' },
    { value: 'FJ', label: 'Figi' },
    { value: 'PH', label: 'Filippine' },
    { value: 'FI', label: 'Finlandia' },
    { value: 'GA', label: 'Gabon' },
    { value: 'GM', label: 'Gambia' },
    { value: 'GE', label: 'Georgia' },
    { value: 'GH', label: 'Ghana' },
    { value: 'JM', label: 'Giamaica' },
    { value: 'JP', label: 'Giappone' },
    { value: 'DJ', label: 'Gibuti' },
    { value: 'JO', label: 'Giordania' },
    { value: 'GR', label: 'Grecia' },
    { value: 'GD', label: 'Grenada' },
    { value: 'GT', label: 'Guatemala' },
    { value: 'GN', label: 'Guinea' },
    { value: 'GW', label: 'Guinea-Bissau' },
    { value: 'GQ', label: 'Guinea Equatoriale' },
    { value: 'GY', label: 'Guyana' },
    { value: 'HT', label: 'Haiti' },
    { value: 'HN', label: 'Honduras' },
    { value: 'IN', label: 'India' },
    { value: 'ID', label: 'Indonesia' },
    { value: 'IR', label: 'Iran' },
    { value: 'IQ', label: 'Iraq' },
    { value: 'IE', label: 'Irlanda' },
    { value: 'IS', label: 'Islanda' },
    { value: 'IL', label: 'Israele' },
    { value: 'KZ', label: 'Kazakistan' },
    { value: 'KE', label: 'Kenya' },
    { value: 'KG', label: 'Kirghizistan' },
    { value: 'KI', label: 'Kiribati' },
    { value: 'XK', label: 'Kosovo' },
    { value: 'KW', label: 'Kuwait' },
    { value: 'LA', label: 'Laos' },
    { value: 'LS', label: 'Lesotho' },
    { value: 'LV', label: 'Lettonia' },
    { value: 'LB', label: 'Libano' },
    { value: 'LR', label: 'Liberia' },
    { value: 'LY', label: 'Libia' },
    { value: 'LI', label: 'Liechtenstein' },
    { value: 'LT', label: 'Lituania' },
    { value: 'LU', label: 'Lussemburgo' },
    { value: 'MK', label: 'Macedonia del Nord' },
    { value: 'MG', label: 'Madagascar' },
    { value: 'MW', label: 'Malawi' },
    { value: 'MY', label: 'Malaysia' },
    { value: 'MV', label: 'Maldive' },
    { value: 'ML', label: 'Mali' },
    { value: 'MT', label: 'Malta' },
    { value: 'MA', label: 'Marocco' },
    { value: 'MH', label: 'Isole Marshall' },
    { value: 'MR', label: 'Mauritania' },
    { value: 'MU', label: 'Mauritius' },
    { value: 'MX', label: 'Messico' },
    { value: 'FM', label: 'Micronesia' },
    { value: 'MD', label: 'Moldavia' },
    { value: 'MC', label: 'Monaco' },
    { value: 'MN', label: 'Mongolia' },
    { value: 'ME', label: 'Montenegro' },
    { value: 'MZ', label: 'Mozambico' },
    { value: 'MM', label: 'Myanmar' },
    { value: 'NA', label: 'Namibia' },
    { value: 'NR', label: 'Nauru' },
    { value: 'NP', label: 'Nepal' },
    { value: 'NI', label: 'Nicaragua' },
    { value: 'NE', label: 'Niger' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'NO', label: 'Norvegia' },
    { value: 'NZ', label: 'Nuova Zelanda' },
    { value: 'NL', label: 'Paesi Bassi' },
    { value: 'PK', label: 'Pakistan' },
    { value: 'PW', label: 'Palau' },
    { value: 'PS', label: 'Palestina' },
    { value: 'PA', label: 'Panama' },
    { value: 'PG', label: 'Papua Nuova Guinea' },
    { value: 'PY', label: 'Paraguay' },
    { value: 'PE', label: 'Perù' },
    { value: 'PL', label: 'Polonia' },
    { value: 'PT', label: 'Portogallo' },
    { value: 'GB', label: 'Regno Unito' },
    { value: 'CF', label: 'Repubblica Centrafricana' },
    { value: 'CZ', label: 'Repubblica Ceca' },
    { value: 'RO', label: 'Romania' },
    { value: 'RW', label: 'Ruanda' },
    { value: 'RU', label: 'Russia' },
    { value: 'KN', label: 'Saint Kitts e Nevis' },
    { value: 'LC', label: 'Santa Lucia' },
    { value: 'VC', label: 'Saint Vincent e Grenadine' },
    { value: 'WS', label: 'Samoa' },
    { value: 'SM', label: 'San Marino' },
    { value: 'ST', label: 'São Tomé e Príncipe' },
    { value: 'SA', label: 'Arabia Saudita' },
    { value: 'SN', label: 'Senegal' },
    { value: 'RS', label: 'Serbia' },
    { value: 'SC', label: 'Seychelles' },
    { value: 'SL', label: 'Sierra Leone' },
    { value: 'SG', label: 'Singapore' },
    { value: 'SK', label: 'Slovacchia' },
    { value: 'SI', label: 'Slovenia' },
    { value: 'SB', label: 'Isole Salomone' },
    { value: 'SO', label: 'Somalia' },
    { value: 'ES', label: 'Spagna' },
    { value: 'LK', label: 'Sri Lanka' },
    { value: 'US', label: 'Stati Uniti' },
    { value: 'ZA', label: 'Sudafrica' },
    { value: 'SD', label: 'Sudan' },
    { value: 'SS', label: 'Sudan del Sud' },
    { value: 'SR', label: 'Suriname' },
    { value: 'SE', label: 'Svezia' },
    { value: 'SZ', label: 'Eswatini' },
    { value: 'SY', label: 'Siria' },
    { value: 'TJ', label: 'Tagikistan' },
    { value: 'TW', label: 'Taiwan' },
    { value: 'TZ', label: 'Tanzania' },
    { value: 'TH', label: 'Thailandia' },
    { value: 'TL', label: 'Timor Est' },
    { value: 'TG', label: 'Togo' },
    { value: 'TO', label: 'Tonga' },
    { value: 'TT', label: 'Trinidad e Tobago' },
    { value: 'TN', label: 'Tunisia' },
    { value: 'TR', label: 'Turchia' },
    { value: 'TM', label: 'Turkmenistan' },
    { value: 'TV', label: 'Tuvalu' },
    { value: 'UA', label: 'Ucraina' },
    { value: 'UG', label: 'Uganda' },
    { value: 'HU', label: 'Ungheria' },
    { value: 'UY', label: 'Uruguay' },
    { value: 'UZ', label: 'Uzbekistan' },
    { value: 'VU', label: 'Vanuatu' },
    { value: 'VA', label: 'Vaticano' },
    { value: 'VE', label: 'Venezuela' },
    { value: 'VN', label: 'Vietnam' },
    { value: 'YE', label: 'Yemen' },
    { value: 'ZM', label: 'Zambia' },
    { value: 'ZW', label: 'Zimbabwe' },
    { value: 'altro', label: 'Altro' },
  ];
  currentInsuranceOptions = [
    { value: 'keine', label: 'automation.opt_ins_none' },
    { value: 'neu in der Schweiz', label: 'automation.opt_ins_new_ch' },
    { value: 'Automate', label: 'automation.opt_ins_automate' },
    { value: 'Allianz Suisse', label: 'automation.opt_ins_allianz' },
    { value: 'AXA', label: 'automation.opt_ins_axa' },
    { value: 'Baloise', label: 'automation.opt_ins_baloise' },
    { value: 'Belsura', label: 'automation.opt_ins_belsura' },
    { value: 'Elvia', label: 'automation.opt_ins_elvia' },
    { value: 'Generali', label: 'automation.opt_ins_generali' },
    { value: 'Helvetia', label: 'automation.opt_ins_helvetia' },
    { value: 'Mobiliar', label: 'automation.opt_ins_mobiliar' },
    { value: 'Postfinance', label: 'automation.opt_ins_postfinance' },
    { value: 'smile.direct', label: 'automation.opt_ins_smile' },
    { value: 'Simpego', label: 'automation.opt_ins_simpego' },
    { value: 'TCS', label: 'automation.opt_ins_tcs' },
    { value: 'TSM', label: 'automation.opt_ins_tsm' },
    { value: 'Vaudoise', label: 'automation.opt_ins_vaudoise' },
    { value: 'Visana', label: 'automation.opt_ins_visana' },
    { value: 'Zürich', label: 'automation.opt_ins_zurich' },
    { value: 'Andere Versicherung', label: 'automation.opt_ins_other' },
    { value: 'Versicherung im Ausland', label: 'automation.opt_ins_abroad' },
  ];
  cantonOptions = [
    { value: 'AR', label: 'AR Appenzello Esterno' },
    { value: 'AI', label: 'AI Appenzello Interno' },
    { value: 'AG', label: 'AG Argovia' },
    { value: 'BL', label: 'BL Basilea Campagna' },
    { value: 'BS', label: 'BS Basilea Città' },
    { value: 'BE', label: 'BE Berna' },
    { value: 'FR', label: 'FR Friburgo' },
    { value: 'FL', label: 'FL Liechtenstein' },
    { value: 'GE', label: 'GE Ginevra' },
    { value: 'JU', label: 'JU Giura' },
    { value: 'GL', label: 'GL Glarona' },
    { value: 'GR', label: 'GR Grigioni' },
    { value: 'LU', label: 'LU Lucerna' },
    { value: 'NE', label: 'NE Neuchâtel' },
    { value: 'NW', label: 'NW Nidvaldo' },
    { value: 'OW', label: 'OW Obvaldo' },
    { value: 'SG', label: 'SG San Gallo' },
    { value: 'SH', label: 'SH Sciaffusa' },
    { value: 'SO', label: 'SO Soletta' },
    { value: 'SZ', label: 'SZ Svitto' },
    { value: 'TI', label: 'TI Ticino' },
    { value: 'TG', label: 'TG Turgovia' },
    { value: 'UR', label: 'UR Uri' },
    { value: 'VS', label: 'VS Vallese' },
    { value: 'VD', label: 'VD Vaud' },
    { value: 'ZG', label: 'ZG Zugo' },
    { value: 'ZH', label: 'ZH Zurigo' },
  ];
  deductibleUnder26Options = [
    { value: 'Si', label: 'automation.opt_ded26_yes' },
    { value: '0', label: 'automation.opt_ded26_no' },
    { value: '1000', label: 'automation.opt_ded26_1000' },
    { value: '2000', label: 'automation.opt_ded26_2000' },
    { value: '5000', label: 'automation.opt_ded26_5000' },
  ];
  siNoOptions = ['Si', 'No'];
  vehicleUsageOptions = [
    { value: 'nessun uso specifico', label: 'automation.opt_usage_none' },
    { value: 'trasporto merci', label: 'automation.opt_usage_cargo' },
    { value: 'corriere', label: 'automation.opt_usage_courier' },
    { value: 'trasporto passeggeri', label: 'automation.opt_usage_passenger' },
    { value: 'taxi', label: 'automation.opt_usage_taxi' },
    { value: 'scuola guida', label: 'automation.opt_usage_driving_school' },
    { value: 'noleggio', label: 'automation.opt_usage_rental' },
  ];
  civilInsuranceOptions = [
    { value: 'Si esclusi alla mia proprieta', label: 'automation.opt_civil_yes_excl' },
    { value: 'Si inclusi alla mia proprieta', label: 'automation.opt_civil_yes_incl' },
    { value: 'No', label: 'automation.opt_civil_no' },
  ];
  comprehensiveOptions = [
    { value: 'Nessuna', label: 'automation.opt_comp_none' },
    { value: 'Parziale', label: 'automation.opt_comp_partial' },
    { value: 'Totale', label: 'automation.opt_comp_total' },
  ];
  deductibleTotalOptions = ['500', '1000', '2000'];
  deductiblePartialOptions = ['0', '200', '500', '1000'];
  parkingDamageOptions = [
    { value: 'No', label: 'automation.opt_park_no' },
    { value: 'Illimitato', label: 'automation.opt_park_unlimited' },
    { value: '1000', label: 'automation.opt_park_1000' },
    { value: '2000', label: 'automation.opt_park_2000' },
  ];
  deductibleParkingOptions = ['0', '200', '500'];
  personalBelongingsOptions = [
    { value: 'No', label: 'automation.opt_belong_no' },
    { value: '2000', label: 'automation.opt_belong_2000' },
    { value: '3000', label: 'automation.opt_belong_3000' },
    { value: '5000', label: 'automation.opt_belong_5000' },
  ];
  garageFreeOptions = [
    { value: 'fissa', label: 'automation.opt_garage_fixed' },
    { value: 'scelta', label: 'automation.opt_garage_choice' },
  ];
  paymentModeOptions = [
    { value: 'Annuale', label: 'automation.opt_payment_annual' },
    { value: 'Semestrale', label: 'automation.opt_payment_semi' },
  ];
  licenseSuspensionOptions = [
    { value: 'keine',              label: 'automation.opt_license_susp_none' },
    { value: '1 Monat',            label: 'automation.opt_license_susp_1m' },
    { value: '2 Monate',           label: 'automation.opt_license_susp_2m' },
    { value: '3 Monate oder mehr', label: 'automation.opt_license_susp_3m_plus' },
  ];
  claimsOptions = ['0', '1', '2', '3'];

  // ─── Nuove option arrays (allineamento contratto API) ───────────────────────
  vehicleTypeOptions = [
    { value: '', label: 'automation.form_select_placeholder' },
    { value: 'passenger_car', label: 'automation.opt_vtype_passenger_car' },
    { value: 'van', label: 'automation.opt_vtype_van' },
  ];
  driveOptions = [
    { value: '', label: 'automation.form_select_placeholder' },
    { value: 'Benzin', label: 'automation.opt_drive_benzin' },
    { value: 'Diesel', label: 'automation.opt_drive_diesel' },
    { value: 'Hybrid-Benzin', label: 'automation.opt_drive_hybrid_benzin' },
    { value: 'Hybrid-Diesel', label: 'automation.opt_drive_hybrid_diesel' },
    { value: 'Electric', label: 'automation.opt_drive_electric' },
  ];
  kmPerYearOptions = [
    { value: '', label: 'automation.form_select_placeholder' },
    { value: '5000', label: '5\'000' },
    { value: '7000', label: '7\'000' },
    { value: '10000', label: '10\'000' },
    { value: '15000', label: '15\'000' },
    { value: '20000', label: '20\'000' },
    { value: '25000', label: '25\'000' },
    { value: '30000', label: '30\'000' },
    { value: '+30000', label: '+30\'000' },
  ];
  reasonsForRedemptionOptions = [
    { value: '', label: 'automation.form_select_placeholder' },
    { value: 'New redemption', label: 'automation.opt_reason_new' },
    { value: 'Vehicle change', label: 'automation.opt_reason_vehicle_change' },
    { value: 'Vehicle change in the interchangeable sign', label: 'automation.opt_reason_vehicle_change_inter' },
    { value: 'Open interchangeable sign', label: 'automation.opt_reason_open_inter' },
    { value: 'Change of ownership', label: 'automation.opt_reason_ownership' },
    { value: 'Changing insurers without changing vehicles', label: 'automation.opt_reason_change_insurers' },
    { value: 'other cases', label: 'automation.opt_reason_other' },
  ];
  submitVehicleProofOptions = [
    { value: '', label: 'automation.form_select_placeholder' },
    { value: 'Yes', label: 'automation.form_yes' },
    { value: 'No', label: 'automation.form_no' },
  ];
  driverTypeOptions = [
    { value: 'user', label: 'automation.opt_driver_user' },
    { value: 'other', label: 'automation.opt_driver_other' },
    { value: 'multiple', label: 'automation.opt_driver_multiple' },
  ];
  // LeasingCompany enum estratto da openapi.json (components.schemas.LeasingCompany.enum) — 123 voci
  leasingCompanyOptions: string[] = [
    'A+A Leasing AG', 'a2B Leasing & Finance AG', 'AGCO Finance AG', 'AGLF AG for Agricultural Financing',
    'AIL Swiss-Austria Leasing AG', 'ALB AG Car Leasing & Consulting', 'ALD Automotive AG', 'Allane Schweiz AG',
    'ALLMECO Leasing GmH, Unterhaching', 'Alphabet Fleet Management Switzerland Ltd.', 'Alphera Financial Services',
    'AMAG Leasing AG', 'ARVAL (Switzerland) AG', 'ASL Auto Service-Leasing AG',
    'Audi Leasing branch office, D-Braunschweig', 'Auto-Interleasing AG, 4132 Muttenz',
    'Auto-Interleasing AG, 8902 Urdorf', 'Ayvens Switzerland AG',
    'Bank11 for Private Customers and Trade GmbH, D-Neuss', 'Bank-now AG', 'Banque cantonale de Genève',
    'Banque CIC (Suisse) SA', 'BAWAG PSK Leasing GmbH, A-Vienna', 'Binelli & Ehrsam AG',
    'BMW Financial Services (Switzerland) AG', 'BNP Paribas Leasing Solutions Suisse SA',
    'BPCE Equipment Solutions Switzerland AG', 'BTV Leasing Switzerland AG', 'BUGA Finanz AG',
    'CA Auto Finance Suisse SA', 'Carauktion AG', 'Cariva AG',
    'Caterpillar Financial Services GmbH, D-Ismaning', 'Cembra Money Bank (ex Cashgate AG)',
    'Cembra Money Bank AG', 'CoOpera Leasing AG', 'Credit Suisse',
    'Credit Suisse (Switzerland) AG, 1003 Lausanne', 'DL Location Leasing SA', 'EFL Autoleasing AG',
    'Emil Frey AG, 8048 Zurich', 'Emil Frey AG, 8050 Zurich',
    'Erste Bank und Sparkassen Leasing GmbH, A-Vienna', 'Europa-Leasing GmbH, D-Kieselbronn',
    'Ferrari Financial Services AG, D-Grünwald/Munich', 'FGA Bank Germany GmbH, D-Heilbronn',
    'Fical Finance AG, 5432, Neuenhof', 'Fire Auto Leasing AG', 'Flexikredit AG', 'FML Leasing AG',
    'Ford Credit (Switzerland) GmbH', 'Ford Credit Europe (FCE)', 'Fortis Lease Suisse SA', 'Franz AG',
    'General Motors Financial Suisse SA', 'Genève Crédit & Leasing SA', 'HARLA Leasing AG',
    'HIL Mobilienleasing GmbH & Co KG, A-Dornbirn', 'Honda (Suisse) SA',
    'Hypo Immobilien & Leasing GmbH, A-Dornbirn', 'Hypo SüdLeasing GmbH, A-Dornbirn',
    'IG Leasing AG (ex Siemens Leasing AG)', 'IMPA Leasing AG', 'IVECO FINANCE AG',
    'LeaseForce AG', 'lease it ag', 'Lease Plan (Switzerland) AG', 'LeaseTeq AG',
    'Leasfinanz GmbH, A-Vienna', 'Leasing-west GmbH, D-Kiefersfelden', 'Leasinvest AG, 9496 Balzers',
    'Leasinvest AG (Switzerland), 9477 Trübbach', 'Lepo Leasing AG', 'Loancar AG',
    'MAN Financial Services GmbH, D-Munich', 'Maserati Financial Services',
    'Mercedes-Benz Bank AG, D-Saarbrücken', 'Mercedes-Benz Financial Services Switzerland AG',
    'MF Fleetmanagement AG', 'Migros Bank AG', 'Mobility Solutions AG',
    'movon AG, 6330 Cham', 'Multilease AG, 1110 Morges', 'Multilease AG, 4624 Härkingen',
    'Multilease AG, 8152 Glattbrugg', 'Multilease AG, 9000 St. Gallen',
    'Multilease AG (Toyota Prius), 8048 Zurich', 'N+C Leasing AG', 'Neumühle Handels AG',
    'Nissan Finance', 'Norddeutsche Landesbank, D-Hannover', 'Opel Finance AG', 'PhG LeasCo',
    'Pierre Sudan Leasing and Finance AG', 'Porsche Financial Services Switzerland AG',
    'Post Company Cars AG', 'PSA Finance Belux SA, B-Bruxelles', 'Raiffeisen Leasing', 'RCI Finance SA',
    'Renault Trucks Financial Services (trucks only)', 'SAM Swiss AG for Mobility',
    'Santander Consumer Bank, D-Mönchengladbach', 'Santander Consumer Finance Switzerland AG',
    'Scania Finance Switzerland AG', 'Scania Leasing Austria Ltd.', 'Settelen AG',
    'SG Equipment Finance Switzerland AG', 'Sixt Leasing (Switzerland) AG', 'SüdLeasing Suisse AG',
    'Swiss Car Finance AG / SsangYong Switzerland AG', 'Swissquote Bank SA', 'TIBERIS AG',
    'UBS Leasing AG', 'Unifin 98 AG', 'Valiant Bank AG', 'Volksbank Rottweil eG, D-Rottweil',
    'Volksbank Vorarlberg Anlagen-Leasing GmbH, A-Rankweil', 'Volkswagen Leasing GmbH, D-Braunschweig',
    'Volvo Finance (Switzerland) AG (trucks only)', 'Vorarlberg State and Mortgage Bank AG, A-Bregenz',
    'Windlin Leasing AG', 'Würth Leasing AG', 'Zurich Cantonal Bank Leasing FS',
  ];

  isTestMode = false;

  // Autocomplete marca nella modale
  modalBrandSuggestions: string[] = [];
  showModalBrandDropdown = false;
  modalBrandLoading = false;
  private readonly modalBrandInput$ = new Subject<string>();
  private readonly modalTypeApprovalInput$ = new Subject<string>();
  private readonly modalSerialInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // Autocomplete PLZ / Località
  plzSuggestions: LocalityEntry[] = [];
  areaSuggestions: LocalityEntry[] = [];
  showPlzDropdown = false;
  showAreaDropdown = false;

  // Autocomplete indirizzo via OpenPLZ
  streetSuggestions: StreetEntry[] = [];
  showAddressDropdown = false;
  addressLoading = false;
  private readonly validAddresses = new Set<string>();
  private readonly addressInput$ = new Subject<string>();

  // Autocomplete main_driver sub-form
  mdPlzSuggestions: LocalityEntry[] = [];
  mdAreaSuggestions: LocalityEntry[] = [];
  mdShowPlzDropdown = false;
  mdShowAreaDropdown = false;
  mdStreetSuggestions: StreetEntry[] = [];
  mdShowAddressDropdown = false;
  mdAddressLoading = false;
  private readonly mdValidAddresses = new Set<string>();
  private readonly mdAddressInput$ = new Subject<string>();

  // Scrapers/assicurazioni disponibili (env meno disabled_scrapers del consulente)
  public availableScrapers: string[] = [];

  // Modalità pubblica (rotta /automation-form-generic-client): nessun consulente loggato,
  // recipient_email dal form, submit con admin api key.
  public publicMode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly automationService: AutomationService,
    private readonly swissCarInfoService: SwissCarInfoService,
    private readonly toasterService: ToasterService,
    private readonly loaderService: LoaderService,
    private readonly i18nService: I18nService,
    private readonly i18nFileService: I18nFileService,
    private readonly storageService: StorageService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.publicMode = !!this.route.snapshot.data['publicMode'];
    if (this.publicMode) {
      const langParam = (this.route.snapshot.queryParamMap.get('lang') || '').toLowerCase();
      const allowed = ['de', 'en', 'fr', 'it'];
      if (allowed.includes(langParam) && langParam !== this.storageService.getItem('selectedLanguage')) {
        this.storageService.setItem('selectedLanguage', langParam);
        this.i18nService.loadLanguage(this.i18nFileService.getLanguageFile(langParam));
        window.location.reload();
        return;
      }
    }
    this.computeAvailableScrapers();
    this.buildForm();
    this.form.get('scrapers')?.setValue([...this.availableScrapers]);
    this.setupConditionalFields();
    this.setupModalBrandStream();
    this.setupModalTypeApprovalStream();
    this.setupModalSerialStream();
    this.setupAddressStream();
    this.setupAddressContextResets();
    this.setupMainDriverAddressStream();
    this.setupMainDriverAddressContextResets();
    // TEMP: auto-fill solo in sviluppo
    if (!environment.production) {
      setTimeout(() => this.fillTestData(), 0);
    }
  }

  private computeAvailableScrapers(): void {
    if (this.publicMode) {
      this.availableScrapers = [...environment.automationScrapers];
      return;
    }
    let disabled: string[] = [];
    try {
      const raw = this.storageService.getItem('consultantDisabledScrapers') || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        disabled = parsed.map((s: string) => String(s).toLowerCase());
      }
    } catch {
      disabled = [];
    }
    this.availableScrapers = environment.automationScrapers.filter(
      (s) => !disabled.includes(s.toLowerCase())
    );
  }

  public isScraperSelected(name: string): boolean {
    const arr: string[] = this.form?.get('scrapers')?.value || [];
    return arr.includes(name);
  }

  public toggleScraper(name: string): void {
    const ctrl = this.form.get('scrapers');
    if (!ctrl) return;
    const current: string[] = Array.isArray(ctrl.value) ? [...ctrl.value] : [];
    const idx = current.indexOf(name);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(name);
    ctrl.setValue(current);
    ctrl.markAsTouched();
  }

  private minArrayLength(min: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const v = control.value;
      return Array.isArray(v) && v.length >= min ? null : { minArrayLength: { required: min, actual: Array.isArray(v) ? v.length : 0 } };
    };
  }

  private setupModalBrandStream(): void {
    this.modalBrandInput$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((q) => {
          this.modalBrandLoading = true;
          return this.swissCarInfoService.searchBrands(q, this.i18nService.currentLanguage);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((brands) => {
        this.modalBrandSuggestions = brands;
        this.showModalBrandDropdown = brands.length > 0;
        this.modalBrandLoading = false;
      });
  }

  private setupModalTypeApprovalStream(): void {
    this.modalTypeApprovalInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((v) => v.length >= 6),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.onSearchVehicles());
  }

  private setupModalSerialStream(): void {
    this.modalSerialInput$
      .pipe(
        filter((v) => v.length === 9),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.onSearchVehicles());
  }

  onModalTypeApprovalInput(value: string): void {
    this.modal.typeApprovalQuery = value;
    if (value.length > 0) {
      this.modal.brandQuery = '';
      this.modal.modelQuery = '';
      this.modal.serialQuery = '';
      this.modalBrandSuggestions = [];
      this.showModalBrandDropdown = false;
    }
    this.modalTypeApprovalInput$.next(value);
  }

  onModalBrandInput(value: string): void {
    this.modal.brandQuery = value;
    if (value.length > 0) { this.modal.serialQuery = ''; this.modal.typeApprovalQuery = ''; }
    if (value.length >= 2) this.modalBrandInput$.next(value);
    else { this.modalBrandSuggestions = []; this.showModalBrandDropdown = false; }
  }

  onModalSerialInput(value: string): void {
    this.modal.serialQuery = value;
    if (value.length > 0) {
      this.modal.typeApprovalQuery = '';
      this.modal.brandQuery = '';
      this.modal.modelQuery = '';
      this.modalBrandSuggestions = [];
      this.showModalBrandDropdown = false;
    }
    this.modalSerialInput$.next(value);
  }

  onModalModelInput(value: string): void {
    this.modal.modelQuery = value;
    if (value.length > 0) { this.modal.serialQuery = ''; this.modal.typeApprovalQuery = ''; }
  }

  selectModalBrand(brand: string): void {
    this.modal.brandQuery = brand;
    this.modalBrandSuggestions = [];
    this.showModalBrandDropdown = false;
  }

  hideModalBrandDropdown(): void {
    setTimeout(() => this.showModalBrandDropdown = false, 200);
  }

  private buildForm(): void {
    this.form = this.fb.group({
      gender: ['Maschio', Validators.required],
      company_name: [''],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      birth_date: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/), this.minAgeFromTodayValidator(18)]],
      first_driving_license_date: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/), this.minAgeValidator(18)]],
      zip_code: ['', [Validators.required, Validators.pattern(/^\d{4}$/), this.plzExistsValidator.bind(this)]],
      area: ['', [Validators.required, this.areaExistsValidator.bind(this)]],
      address: ['', [Validators.required, this.addressFromApiValidator.bind(this)]],
      address_number: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, this.noPlusEmailValidator]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
      nationality: ['CH', Validators.required],
      foreigners_id_type: [''],
      language: ['de', Validators.required],

      main_driver_type: ['user'],
      main_driver: this.fb.group({
        gender: [''],
        first_name: [''],
        last_name: [''],
        birth_date: ['', [Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/), this.minAgeFromTodayValidator(18)]],
        first_driving_license_date: ['', [Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/), this.minAgeValidator(18)]],
        zip_code: ['', [Validators.pattern(/^\d{4}$/), this.plzExistsValidator.bind(this)]],
        canton: [''],
        area: ['', [this.mdAreaExistsValidator]],
        address: ['', [this.mdAddressFromApiValidator]],
        address_number: [''],
        nationality: [''],
        foreigners_id_type: [''],
      }),

      deductible_under_26: ['0'],
      n_certificate_1: ['', Validators.pattern(/^\d[A-Za-z]{2}\d{3}$/)],
      car_brand_1: ['', Validators.required],
      car_model_1: ['', Validators.required],
      serial_number_1: ['', [Validators.required, Validators.pattern(/^\d{9}$/), this.obviousSerialValidator.bind(this)]],
      accessories_1: [null],
      canton: ['ZH', Validators.required],
      license_plate: [''],
      first_registration_date_1: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)]],
      leasing_1: ['No', Validators.required],
      garage_parking_1: ['Si', Validators.required],
      interchangeable_plate: ['No', Validators.required],
      vehicle_type_1: [''],
      drive_1: [''],
      purchase_date_1: ['', Validators.pattern(/^(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)],
      kilometers_per_year_1: [''],
      current_mileage_1: [null],
      reasons_for_redemption_1: [''],
      leasing_company_1: [''],
      submit_vehicle_proof_1: [''],

      n_certificate_2: ['', Validators.pattern(/^\d[A-Za-z]{2}\d{3}$/)],
      car_brand_2: [''],
      car_model_2: [''],
      accessories_2: [null],
      serial_number_2: ['', [Validators.pattern(/^\d{9}$/), this.obviousSerialValidator.bind(this)]],
      first_registration_date_2: ['', Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)],
      leasing_2: ['No'],
      garage_parking_2: ['Si'],
      vehicle_type_2: [''],
      drive_2: [''],
      purchase_date_2: ['', Validators.pattern(/^(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)],
      kilometers_per_year_2: [''],
      current_mileage_2: [null],
      reasons_for_redemption_2: [''],
      leasing_company_2: [''],
      submit_vehicle_proof_2: [''],

      vehicle_usage: ['nessun uso specifico', Validators.required],
      civil_insurance: ['Si inclusi alla mia proprieta', Validators.required],
      comprehensive_insurance: ['Totale', Validators.required],
      deductible_total_insurance: ['1000'],
      deductible_partial_insurance: ['0'],
      parking_damage_coverage: ['No'],
      deductible_parking_damage: [''],
      headlights_mirrors: ['Si', Validators.required],
      personal_belongings_coverage: ['2000', Validators.required],
      tires_damage: ['No', Validators.required],
      bonus_protection: ['Si', Validators.required],
      roadside_assistance: ['Si', Validators.required],
      garage_free_choice: ['fissa', Validators.required],
      passenger_injury: ['No', Validators.required],
      ev_charging_station: [false],
      ev_high_voltage_battery: [false],
      ev_cyber_protection: [false],
      ev_charging_cards_apps: [false],
      payment_mode: ['Annuale', Validators.required],

      current_insurance: ['Baloise', Validators.required],
      n_rc_claims_5_years: ['0', Validators.required],
      n_collisions_claims_5_years: ['0', Validators.required],
      n_parking_claims_5_years: ['0', Validators.required],
      n_glass_claims_5_years: ['0', Validators.required],
      n_partial_comprehensive_claims_5_years: ['0', Validators.required],
      n_rc_claims_3_years: ['0'],
      n_collisions_claims_3_years: ['0'],
      n_parking_claims_3_years: ['0'],
      n_glass_claims_3_years: ['0'],
      n_partial_comprehensive_claims_3_years: ['0'],
      source_user: [''],

      other_q_terminated: [false],
      other_q_refused: [false],
      other_q_license_suspension: ['keine'],

      recipient_email: ['', this.publicMode ? [Validators.required, Validators.email, this.noPlusEmailValidator] : [this.noPlusEmailValidator]],
      scrapers: [[], this.minArrayLength(1)],

      request_type: ['Vergleich Versicherungsangebote', Validators.required],
      registration_scraper: [''],
    });
  }

  private setupConditionalFields(): void {
    this.form.get('gender')!.valueChanges.subscribe((val) => {
      const ctrl = this.form.get('company_name')!;
      if (val === 'Azienda') ctrl.setValidators(Validators.required);
      else { ctrl.clearValidators(); ctrl.setValue(''); }
      ctrl.updateValueAndValidity();

      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/;
      const nameFn = this.form.get('first_name')!;
      const surnameFn = this.form.get('last_name')!;
      const birthFn = this.form.get('birth_date')!;
      const licenseFn = this.form.get('first_driving_license_date')!;
      if (val === 'Azienda') {
        [nameFn, surnameFn, birthFn, licenseFn].forEach((c) => {
          c.clearValidators();
          c.setValue('', { emitEvent: false });
          c.updateValueAndValidity({ emitEvent: false });
        });
      } else {
        nameFn.setValidators(Validators.required);
        surnameFn.setValidators(Validators.required);
        birthFn.setValidators([Validators.required, Validators.pattern(dateRegex)]);
        licenseFn.setValidators([Validators.required, Validators.pattern(dateRegex), this.minAgeValidator(18)]);
        [nameFn, surnameFn, birthFn, licenseFn].forEach((c) => c.updateValueAndValidity({ emitEvent: false }));
      }
    });

    this.form.get('nationality')!.valueChanges.subscribe((val) => {
      const ctrl = this.form.get('foreigners_id_type')!;
      if (val && val.toUpperCase() !== 'CH') ctrl.setValidators(Validators.required);
      else { ctrl.clearValidators(); ctrl.setValue(''); }
      ctrl.updateValueAndValidity();
    });

    this.form.get('interchangeable_plate')!.valueChanges.subscribe((val) => {
      const fields = ['car_brand_2','car_model_2','first_registration_date_2','leasing_2','garage_parking_2'];
      fields.forEach((f) => {
        const ctrl = this.form.get(f)!;
        if (val === 'Si') ctrl.setValidators(Validators.required);
        else ctrl.clearValidators();
        ctrl.updateValueAndValidity();
      });
      const sn2 = this.form.get('serial_number_2')!;
      sn2.setValidators(val === 'Si'
        ? [Validators.required, Validators.pattern(/^\d{9}$/), this.obviousSerialValidator.bind(this)]
        : [Validators.pattern(/^\d{9}$/), this.obviousSerialValidator.bind(this)]);
      sn2.updateValueAndValidity();
      // riallinea il required di submit_vehicle_proof_2 alla modalità corrente
      this.applyRequestTypeValidators();
    });

    const checkLeasing = () => {
      if (this.form.get('leasing_1')!.value === 'Si' || this.form.get('leasing_2')!.value === 'Si') {
        this.form.get('comprehensive_insurance')!.setValue('Totale');
      }
    };
    this.form.get('leasing_1')!.valueChanges.subscribe(checkLeasing);
    this.form.get('leasing_2')!.valueChanges.subscribe(checkLeasing);

    this.form.get('comprehensive_insurance')!.valueChanges.subscribe((val) => {
      const total = this.form.get('deductible_total_insurance')!;
      const partial = this.form.get('deductible_partial_insurance')!;
      if (val === 'Totale') { total.setValidators(Validators.required); partial.setValidators(Validators.required); }
      else if (val === 'Parziale') { total.clearValidators(); partial.setValidators(Validators.required); }
      else { total.clearValidators(); partial.clearValidators(); }
      total.updateValueAndValidity();
      partial.updateValueAndValidity();
    });

    this.form.get('birth_date')!.valueChanges.subscribe(() => {
      this.form.get('first_driving_license_date')?.updateValueAndValidity({ emitEvent: false });
    });

    this.form.get('parking_damage_coverage')!.valueChanges.subscribe((val) => {
      const ctrl = this.form.get('deductible_parking_damage')!;
      if (val && val !== 'No') ctrl.setValidators(Validators.required);
      else ctrl.clearValidators();
      ctrl.updateValueAndValidity();
    });

    this.form.get('gender')!.valueChanges.subscribe((val) => {
      if (val !== 'Azienda' && this.form.get('main_driver_type')?.value === 'multiple') {
        this.form.get('main_driver_type')!.setValue('user');
      }
    });

    this.form.get('main_driver_type')!.valueChanges.subscribe((val) => {
      const sub = this.form.get('main_driver') as FormGroup;
      const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/;
      const requiredFields = ['gender', 'first_name', 'last_name', 'birth_date', 'first_driving_license_date', 'zip_code', 'canton', 'area', 'address', 'address_number', 'nationality'];
      requiredFields.forEach((f) => {
        const ctrl = sub.get(f)!;
        if (val === 'other') {
          if (f === 'birth_date') {
            ctrl.setValidators([Validators.required, Validators.pattern(dateRegex), this.minAgeFromTodayValidator(18)]);
          } else if (f === 'first_driving_license_date') {
            ctrl.setValidators([Validators.required, Validators.pattern(dateRegex), this.minAgeValidator(18)]);
          } else if (f === 'zip_code') {
            ctrl.setValidators([Validators.required, Validators.pattern(/^\d{4}$/), this.plzExistsValidator.bind(this)]);
          } else if (f === 'area') {
            ctrl.setValidators([Validators.required, this.mdAreaExistsValidator]);
          } else if (f === 'address') {
            ctrl.setValidators([Validators.required, this.mdAddressFromApiValidator]);
          } else {
            ctrl.setValidators(Validators.required);
          }
        } else {
          if (f === 'birth_date') {
            ctrl.setValidators([Validators.pattern(dateRegex), this.minAgeFromTodayValidator(18)]);
          } else if (f === 'first_driving_license_date') {
            ctrl.setValidators([Validators.pattern(dateRegex), this.minAgeValidator(18)]);
          } else if (f === 'zip_code') {
            ctrl.setValidators([Validators.pattern(/^\d{4}$/), this.plzExistsValidator.bind(this)]);
          } else if (f === 'area') {
            ctrl.setValidators([this.mdAreaExistsValidator]);
          } else if (f === 'address') {
            ctrl.setValidators([this.mdAddressFromApiValidator]);
          } else {
            ctrl.clearValidators();
          }
        }
        ctrl.updateValueAndValidity();
      });
      // foreigners_id_type: required solo se nationality != CH (e main_driver_type === 'other')
      const nat = (sub.get('nationality')?.value ?? '').toUpperCase();
      const fid = sub.get('foreigners_id_type')!;
      if (val === 'other' && nat && nat !== 'CH') fid.setValidators(Validators.required);
      else { fid.clearValidators(); fid.setValue(''); }
      fid.updateValueAndValidity();
    });

    (this.form.get('main_driver') as FormGroup).get('nationality')!.valueChanges.subscribe((val) => {
      const sub = this.form.get('main_driver') as FormGroup;
      const fid = sub.get('foreigners_id_type')!;
      const isOther = this.form.get('main_driver_type')?.value === 'other';
      if (isOther && val && val.toUpperCase() !== 'CH') fid.setValidators(Validators.required);
      else { fid.clearValidators(); fid.setValue(''); }
      fid.updateValueAndValidity();
    });

    (this.form.get('main_driver') as FormGroup).get('birth_date')!.valueChanges.subscribe(() => {
      (this.form.get('main_driver') as FormGroup).get('first_driving_license_date')?.updateValueAndValidity({ emitEvent: false });
    });

    this.form.get('request_type')!.valueChanges.subscribe(() => this.applyRequestTypeValidators());
  }

  private applyRequestTypeValidators(): void {
    const regScraper = this.form.get('registration_scraper')!;
    const scrapers = this.form.get('scrapers')!;
    const proof1 = this.form.get('submit_vehicle_proof_1')!;
    const proof2 = this.form.get('submit_vehicle_proof_2')!;
    const hasV2 = this.showVehicle2;

    if (this.isRegistrationOnly) {
      regScraper.setValidators(Validators.required);
      scrapers.clearValidators();
      scrapers.setValue([], { emitEvent: false });
      proof1.clearValidators();
      proof1.setValue('', { emitEvent: false });
      proof2.clearValidators();
      proof2.setValue('', { emitEvent: false });
    } else if (this.isOfferAndRegistration) {
      regScraper.setValidators(Validators.required);
      scrapers.clearValidators();
      scrapers.setValue([], { emitEvent: false });
      proof1.setValidators(Validators.required);
      if (hasV2) proof2.setValidators(Validators.required);
      else { proof2.clearValidators(); proof2.setValue('', { emitEvent: false }); }
    } else {
      // isCompareOffers (default)
      regScraper.clearValidators();
      regScraper.setValue('', { emitEvent: false });
      scrapers.setValidators(this.minArrayLength(1));
      proof1.clearValidators();
      proof2.clearValidators();
    }

    [regScraper, scrapers, proof1, proof2].forEach((c) => c.updateValueAndValidity({ emitEvent: false }));
  }

  get successMessage(): string {
    return this.i18nService
      .getTranslation('automation', 'form_success_message')
      .replace('{email}', this.submittedEmail);
  }

  get showVehicle2(): boolean { return this.form.get('interchangeable_plate')?.value === 'Si'; }
  get showForeignersId(): boolean { const v = this.form.get('nationality')?.value; return v && v.toUpperCase() !== 'CH'; }
  get showMainDriverForeignersId(): boolean {
    const v = (this.form.get('main_driver') as FormGroup)?.get('nationality')?.value;
    return v && v.toUpperCase() !== 'CH';
  }
  get showCompanyName(): boolean { return this.form.get('gender')?.value === 'Azienda'; }
  get showPersonalNameFields(): boolean { return this.form.get('gender')?.value !== 'Azienda'; }
  get showDeductibleTotal(): boolean { return this.form.get('comprehensive_insurance')?.value === 'Totale'; }
  get showDeductiblePartial(): boolean { return ['Totale','Parziale'].includes(this.form.get('comprehensive_insurance')?.value); }
  get showDeductibleParking(): boolean { return this.form.get('parking_damage_coverage')?.value !== 'No'; }
  get showMainDriverFields(): boolean { return this.form.get('main_driver_type')?.value === 'other'; }
  get visibleDriverTypeOptions() {
    const isCompany = this.form.get('gender')?.value === 'Azienda';
    return isCompany ? this.driverTypeOptions : this.driverTypeOptions.filter(d => d.value !== 'multiple');
  }
  get showLeasingCompany1(): boolean { return this.form.get('leasing_1')?.value === 'Si'; }
  get showLeasingCompany2(): boolean { return this.form.get('leasing_2')?.value === 'Si'; }

  // Tipo richiesta (immatricolazione)
  public registrationScraperOptions: string[] = ['zurich', 'automate', 'helvetia', 'axa', 'mobiliar', 'allianz'];
  get isRegistrationOnly(): boolean { return this.form?.get('request_type')?.value === 'Nur Nachweis bestellen'; }
  get isCompareOffers(): boolean { return this.form?.get('request_type')?.value === 'Vergleich Versicherungsangebote'; }
  get isOfferAndRegistration(): boolean { return this.form?.get('request_type')?.value === 'Offerte und Nachweis nur von dieser Versicherung'; }
  get showRegistrationScraper(): boolean { return this.isRegistrationOnly || this.isOfferAndRegistration; }
  get showSubmitVehicleProof(): boolean { return this.isOfferAndRegistration; }
  get showScrapersSection(): boolean { return this.isCompareOffers; }

  private parseDdMmYyyy(value: string): Date | null {
    if (!value) return null;
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
    if (!match) return null;
    const dd = Number(match[1]);
    const mm = Number(match[2]);
    const yyyy = Number(match[3]);
    const d = new Date(yyyy, mm - 1, dd);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
    return d;
  }

  private noPlusEmailValidator(control: AbstractControl): ValidationErrors | null {
    const val = (control.value ?? '').toString();
    if (!val) return null;
    return val.includes('+') ? { emailPlus: true } : null;
  }

  private obviousSerialValidator(control: AbstractControl): ValidationErrors | null {
    const digits = (control.value ?? '').toString();
    if (digits.length < 2) return null;
    if (new Set(digits).size === 1) return { obviousSerial: true };
    const diffs = new Set<number>();
    for (let i = 0; i < digits.length - 1; i++) {
      const a = digits.charCodeAt(i) - 48;
      const b = digits.charCodeAt(i + 1) - 48;
      if (a < 0 || a > 9 || b < 0 || b > 9) return null;
      diffs.add((b - a + 10) % 10);
    }
    if (diffs.size === 1 && (diffs.has(1) || diffs.has(9))) return { obviousSerial: true };
    return null;
  }

  private minAgeFromTodayValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const birthDate = this.parseDdMmYyyy(control.value);
      if (!birthDate) return null;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      return age < minAge ? { minAge: { requiredAge: minAge, actualAge: age } } : null;
    };
  }

  private minAgeValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) return null;
      const licenseDate = this.parseDdMmYyyy(control.value);
      const birthDate = this.parseDdMmYyyy(parent.get('birth_date')?.value);
      if (!licenseDate || !birthDate) return null;
      let age = licenseDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = licenseDate.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && licenseDate.getDate() < birthDate.getDate())) age--;
      return age < minAge ? { minAge: { requiredAge: minAge, actualAge: age } } : null;
    };
  }

  isInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl?.invalid && (this.submitted || !!ctrl?.touched);
  }

  getError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.invalid || (!this.submitted && !ctrl.touched)) return null;
    if (ctrl.hasError('required')) return this.i18nService.getTranslation('automation', 'form_err_required');
    if (ctrl.hasError('plzNotFound')) return this.i18nService.getTranslation('automation', 'form_err_zip_not_found');
    if (ctrl.hasError('areaNotFound')) return this.i18nService.getTranslation('automation', 'form_err_area_not_found');
    if (ctrl.hasError('addressNotFromApi')) return this.i18nService.getTranslation('automation', 'form_err_address_not_found');
    if (ctrl.hasError('email')) return this.i18nService.getTranslation('automation', 'form_err_email');
    if (ctrl.hasError('emailPlus')) return this.i18nService.getTranslation('automation', 'form_err_email_no_plus');
    if (ctrl.hasError('pattern')) {
      const dateFields = ['birth_date','first_driving_license_date','first_registration_date_1','first_registration_date_2'];
      if (dateFields.includes(name)) return this.i18nService.getTranslation('automation', 'form_err_date_format');
      if (name === 'n_certificate_1' || name === 'n_certificate_2') return this.i18nService.getTranslation('automation', 'form_n_certificate_error');
      if (name === 'serial_number_1' || name === 'serial_number_2') return this.i18nService.getTranslation('automation', 'form_serial_number_error');
      return this.i18nService.getTranslation('automation', 'form_err_invalid_format');
    }
    if (ctrl.hasError('obviousSerial')) return this.i18nService.getTranslation('automation', 'form_serial_number_obvious_error');
    if (ctrl.hasError('minAge')) return this.i18nService.getTranslation('automation', 'form_err_min_age_18');
    return this.i18nService.getTranslation('automation', 'form_err_invalid_value');
  }

  isMainDriverInvalid(name: string): boolean {
    const ctrl = (this.form.get('main_driver') as FormGroup)?.get(name);
    return !!ctrl?.invalid && (this.submitted || !!ctrl?.touched);
  }

  getMainDriverError(name: string): string | null {
    const ctrl = (this.form.get('main_driver') as FormGroup)?.get(name);
    if (!ctrl || !ctrl.invalid || (!this.submitted && !ctrl.touched)) return null;
    if (ctrl.hasError('required')) return this.i18nService.getTranslation('automation', 'form_err_required');
    if (ctrl.hasError('plzNotFound')) return this.i18nService.getTranslation('automation', 'form_err_zip_not_found');
    if (ctrl.hasError('areaNotFound')) return this.i18nService.getTranslation('automation', 'form_err_area_not_found');
    if (ctrl.hasError('addressNotFromApi')) return this.i18nService.getTranslation('automation', 'form_err_address_not_found');
    if (ctrl.hasError('pattern')) {
      if (name === 'zip_code') return this.i18nService.getTranslation('automation', 'form_err_invalid_format');
      return this.i18nService.getTranslation('automation', 'form_err_date_format');
    }
    if (ctrl.hasError('minAge')) return this.i18nService.getTranslation('automation', 'form_err_min_age_18');
    return this.i18nService.getTranslation('automation', 'form_err_invalid_value');
  }

  onDateInput(event: Event, controlName: string): void {
    const inputEvent = event as InputEvent;
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');
    if (digits.length > 8) digits = digits.substring(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += '.';
      formatted += digits[i];
    }
    if (inputEvent.inputType !== 'deleteContentBackward' && (digits.length === 2 || digits.length === 4)) formatted += '.';
    input.value = formatted;
    this.form.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  onMonthYearInput(event: Event, controlName: string): void {
    const inputEvent = event as InputEvent;
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');
    if (digits.length > 6) digits = digits.substring(0, 6);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2) formatted += '.';
      formatted += digits[i];
    }
    if (inputEvent.inputType !== 'deleteContentBackward' && digits.length === 2) formatted += '.';
    input.value = formatted;
    this.form.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  onMainDriverDateInput(event: Event, controlName: string): void {
    const inputEvent = event as InputEvent;
    const input = event.target as HTMLInputElement;
    let digits = input.value.replace(/\D/g, '');
    if (digits.length > 8) digits = digits.substring(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += '.';
      formatted += digits[i];
    }
    if (inputEvent.inputType !== 'deleteContentBackward' && (digits.length === 2 || digits.length === 4)) formatted += '.';
    input.value = formatted;
    (this.form.get('main_driver') as FormGroup).get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resolveRecipientEmail(formEmail: string): string {
    if (this.publicMode) {
      const v = (this.form.get('recipient_email')?.value || '').toString().trim();
      return v || formEmail;
    }
    try {
      const cached = this.storageService.getItem('consultantData');
      if (cached) {
        const u = (JSON.parse(cached)?.ecohub_username || '').toString().trim();
        if (u) return u;
      }
    } catch { /* ignore */ }
    return formEmail;
  }

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {
      this.toasterService.warn(this.i18nService.getTranslation('automation', 'form_err_fill_required'));
      return;
    }
    const {
      ev_charging_station, ev_high_voltage_battery, ev_cyber_protection, ev_charging_cards_apps,
      other_q_terminated, other_q_refused, other_q_license_suspension,
      main_driver_type, main_driver,
      request_type, registration_scraper,
      submit_vehicle_proof_1, submit_vehicle_proof_2,
      scrapers,
      ...rest
    } = this.form.value;
    const otherQuestions: string[] = [];
    if (other_q_terminated) otherQuestions.push(this.i18nService.getTranslation('automation', 'form_other_q_terminated'));
    if (other_q_refused) otherQuestions.push(this.i18nService.getTranslation('automation', 'form_other_q_refused'));
    if (other_q_license_suspension && other_q_license_suspension !== 'keine') {
      const base = this.i18nService.getTranslation('automation', 'form_other_q_license_suspension');
      const opt = this.licenseSuspensionOptions.find(o => o.value === other_q_license_suspension);
      const dur = opt ? this.i18nService.getTranslation('automation', opt.label.replace(/^automation\./, '')) : other_q_license_suspension;
      otherQuestions.push(`${base}: ${dur}`);
    }
    const recipientEmail = this.resolveRecipientEmail(rest.email);
    const payload: Record<string, unknown> = {
      ...rest,
      recipient_email: recipientEmail,
      electric_vehicle: {
        'stazione di ricarica e accessori': !!ev_charging_station,
        'batterie alta tensione': !!ev_high_voltage_battery,
        'protezione informatica': !!ev_cyber_protection,
        'protezione carte ricarica e app': !!ev_charging_cards_apps,
      },
      other_questions: otherQuestions.join(', '),
      source: this.publicMode ? 'onezone_cliente' : 'onezone_consulente',
    };

    // Flag immatricolazione / scrapers in base al tipo di richiesta
    if (this.isRegistrationOnly) {
      payload['registration_scraper'] = registration_scraper;
      payload['registration_only'] = true;
    } else if (this.isOfferAndRegistration) {
      payload['registration_scraper'] = registration_scraper;
      payload['registration_only'] = false;
      if (submit_vehicle_proof_1) payload['submit_vehicle_proof_1'] = submit_vehicle_proof_1;
      if (this.showVehicle2 && submit_vehicle_proof_2) payload['submit_vehicle_proof_2'] = submit_vehicle_proof_2;
    } else {
      payload['scrapers'] = scrapers;
      if (submit_vehicle_proof_1) payload['submit_vehicle_proof_1'] = submit_vehicle_proof_1;
      if (this.showVehicle2 && submit_vehicle_proof_2) payload['submit_vehicle_proof_2'] = submit_vehicle_proof_2;
    }

    if (main_driver_type === 'other') {
      const driverData: Record<string, unknown> = {};
      Object.entries(main_driver || {}).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) driverData[k] = v;
      });
      payload['main_driver'] = { driver_type: 'other', driver: driverData };
    } else if (main_driver_type === 'multiple') {
      payload['main_driver'] = { driver_type: 'multiple' };
    }
    this.loaderService.show();
    try {
      await firstValueFrom(this.automationService.submitQuoteRequest(payload as never, this.publicMode));
      this.submittedEmail = recipientEmail;
      this.submitSuccess = true;
      this.loaderService.hide();
    } catch (err) {
      this.loaderService.hide();
      if (err instanceof HttpErrorResponse && err.status === 429) {
        this.toasterService.warn(this.i18nService.getTranslation('automation', 'error_pool_full'));
      } else {
        this.toasterService.warn(this.i18nService.getTranslation('automation', 'error_generic'));
      }
    }
  }

  private setupAddressStream(): void {
    this.addressInput$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((v) => v.length >= 3 && this.canQueryStreets()),
        switchMap((name) => {
          this.addressLoading = true;
          const plz = this.form.get('zip_code')!.value.toString();
          const area = this.form.get('area')!.value.toString();
          return this.automationService.searchStreets(name, plz, area);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((streets) => {
        this.streetSuggestions = streets;
        streets.forEach((s) => this.validAddresses.add(s.name.toLowerCase()));
        this.showAddressDropdown = streets.length > 0;
        this.addressLoading = false;
        this.form.get('address')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  private setupAddressContextResets(): void {
    const reset = () => {
      this.streetSuggestions = [];
      this.showAddressDropdown = false;
      this.validAddresses.clear();
      const addr = this.form.get('address');
      if (addr?.value) addr.setValue('', { emitEvent: false });
      addr?.updateValueAndValidity({ emitEvent: false });
    };
    this.form.get('zip_code')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(reset);
    this.form.get('area')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(reset);
  }

  public canQueryStreets(): boolean {
    const plzCtrl = this.form.get('zip_code');
    const areaCtrl = this.form.get('area');
    if (!plzCtrl || !areaCtrl) return false;
    if (plzCtrl.hasError('plzNotFound') || plzCtrl.hasError('required') || plzCtrl.hasError('pattern')) return false;
    if (areaCtrl.hasError('areaNotFound') || areaCtrl.hasError('required')) return false;
    const plz = (plzCtrl.value || '').toString();
    const area = (areaCtrl.value || '').toString().trim();
    return plz.length === 4 && area.length > 0;
  }

  onAddressInput(value: string): void {
    if (!this.canQueryStreets()) {
      this.streetSuggestions = [];
      this.showAddressDropdown = false;
      return;
    }
    if (value.length >= 3) {
      this.addressInput$.next(value);
    } else {
      this.streetSuggestions = [];
      this.showAddressDropdown = false;
    }
  }

  selectStreet(s: StreetEntry): void {
    this.validAddresses.add(s.name.toLowerCase());
    this.form.patchValue({ address: s.name });
    this.showAddressDropdown = false;
    this.streetSuggestions = [];
  }

  hideAddressDropdown(): void { setTimeout(() => this.showAddressDropdown = false, 200); }

  private addressFromApiValidator(control: AbstractControl): ValidationErrors | null {
    const val = (control.value || '').toString().trim();
    if (!val) return null;
    return this.validAddresses.has(val.toLowerCase()) ? null : { addressNotFromApi: true };
  }

  private areaExistsValidator(control: AbstractControl): ValidationErrors | null {
    const area = control.value?.toString().trim() || '';
    if (!area) return null;
    const plz = this.form?.get('zip_code')?.value?.toString() || '';
    if (plz.length !== 4) return null;
    const localities = this.automationService.getLocalitiesByPlz(plz);
    return localities.some((l) => l.locality === area) ? null : { areaNotFound: true };
  }

  private plzExistsValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value?.toString() || '';
    if (val.length !== 4) return null;
    return this.automationService.getLocalitiesByPlz(val).length > 0 ? null : { plzNotFound: true };
  }

  onPlzInput(): void {
    const val = this.form.get('zip_code')?.value?.toString() || '';
    if (val.length >= 2) {
      this.plzSuggestions = this.automationService.searchByPlz(val);
      this.showPlzDropdown = this.plzSuggestions.length > 0;
    } else {
      this.plzSuggestions = [];
      this.showPlzDropdown = false;
    }
    this.form.get('area')?.updateValueAndValidity();
  }

  selectPlz(entry: LocalityEntry): void {
    this.form.patchValue({ zip_code: entry.plz, area: entry.locality, canton: entry.canton });
    this.showPlzDropdown = false;
    this.plzSuggestions = [];
  }

  onAreaFocus(): void {
    const plz = this.form.get('zip_code')?.value?.toString() || '';
    if (plz.length === 4) {
      this.areaSuggestions = this.automationService.getLocalitiesByPlz(plz);
      this.showAreaDropdown = this.areaSuggestions.length > 1;
    }
  }

  selectArea(entry: LocalityEntry): void {
    this.form.patchValue({ area: entry.locality, canton: entry.canton });
    this.showAreaDropdown = false;
    this.areaSuggestions = [];
  }

  hidePlzDropdown(): void { setTimeout(() => this.showPlzDropdown = false, 200); }
  hideAreaDropdown(): void { setTimeout(() => this.showAreaDropdown = false, 200); }

  // ── Autocomplete main_driver sub-form ──────────────────────────────────────
  private get mainDriverGroup(): FormGroup { return this.form.get('main_driver') as FormGroup; }

  private mdAreaExistsValidator = (control: AbstractControl): ValidationErrors | null => {
    const area = control.value?.toString().trim() || '';
    if (!area) return null;
    const plz = (control.parent?.get('zip_code')?.value ?? '').toString();
    if (plz.length !== 4) return null;
    const localities = this.automationService.getLocalitiesByPlz(plz);
    return localities.some((l) => l.locality === area) ? null : { areaNotFound: true };
  };

  private mdAddressFromApiValidator = (control: AbstractControl): ValidationErrors | null => {
    const val = (control.value || '').toString().trim();
    if (!val) return null;
    return this.mdValidAddresses.has(val.toLowerCase()) ? null : { addressNotFromApi: true };
  };

  public canQueryMainDriverStreets(): boolean {
    const plzCtrl = this.mainDriverGroup?.get('zip_code');
    const areaCtrl = this.mainDriverGroup?.get('area');
    if (!plzCtrl || !areaCtrl) return false;
    if (plzCtrl.hasError('plzNotFound') || plzCtrl.hasError('required') || plzCtrl.hasError('pattern')) return false;
    if (areaCtrl.hasError('areaNotFound') || areaCtrl.hasError('required')) return false;
    const plz = (plzCtrl.value || '').toString();
    const area = (areaCtrl.value || '').toString().trim();
    return plz.length === 4 && area.length > 0;
  }

  onMainDriverPlzInput(): void {
    const val = this.mainDriverGroup?.get('zip_code')?.value?.toString() || '';
    if (val.length >= 2) {
      this.mdPlzSuggestions = this.automationService.searchByPlz(val);
      this.mdShowPlzDropdown = this.mdPlzSuggestions.length > 0;
    } else {
      this.mdPlzSuggestions = [];
      this.mdShowPlzDropdown = false;
    }
    this.mainDriverGroup?.get('area')?.updateValueAndValidity();
  }

  selectMainDriverPlz(entry: LocalityEntry): void {
    this.mainDriverGroup?.patchValue({ zip_code: entry.plz, area: entry.locality, canton: entry.canton });
    this.mdShowPlzDropdown = false;
    this.mdPlzSuggestions = [];
  }

  onMainDriverAreaFocus(): void {
    const plz = this.mainDriverGroup?.get('zip_code')?.value?.toString() || '';
    if (plz.length === 4) {
      this.mdAreaSuggestions = this.automationService.getLocalitiesByPlz(plz);
      this.mdShowAreaDropdown = this.mdAreaSuggestions.length > 1;
    }
  }

  selectMainDriverArea(entry: LocalityEntry): void {
    this.mainDriverGroup?.patchValue({ area: entry.locality, canton: entry.canton });
    this.mdShowAreaDropdown = false;
    this.mdAreaSuggestions = [];
  }

  onMainDriverAddressInput(value: string): void {
    if (!this.canQueryMainDriverStreets()) {
      this.mdStreetSuggestions = [];
      this.mdShowAddressDropdown = false;
      return;
    }
    if (value.length >= 3) {
      this.mdAddressInput$.next(value);
    } else {
      this.mdStreetSuggestions = [];
      this.mdShowAddressDropdown = false;
    }
  }

  selectMainDriverStreet(s: StreetEntry): void {
    this.mdValidAddresses.add(s.name.toLowerCase());
    this.mainDriverGroup?.patchValue({ address: s.name });
    this.mdShowAddressDropdown = false;
    this.mdStreetSuggestions = [];
  }

  hideMainDriverPlzDropdown(): void { setTimeout(() => this.mdShowPlzDropdown = false, 200); }
  hideMainDriverAreaDropdown(): void { setTimeout(() => this.mdShowAreaDropdown = false, 200); }
  hideMainDriverAddressDropdown(): void { setTimeout(() => this.mdShowAddressDropdown = false, 200); }

  private setupMainDriverAddressStream(): void {
    this.mdAddressInput$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((v) => v.length >= 3 && this.canQueryMainDriverStreets()),
        switchMap((name) => {
          this.mdAddressLoading = true;
          const plz = this.mainDriverGroup.get('zip_code')!.value.toString();
          const area = this.mainDriverGroup.get('area')!.value.toString();
          return this.automationService.searchStreets(name, plz, area);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((streets) => {
        this.mdStreetSuggestions = streets;
        streets.forEach((s) => this.mdValidAddresses.add(s.name.toLowerCase()));
        this.mdShowAddressDropdown = streets.length > 0;
        this.mdAddressLoading = false;
        this.mainDriverGroup.get('address')?.updateValueAndValidity({ emitEvent: false });
      });
  }

  private setupMainDriverAddressContextResets(): void {
    const reset = () => {
      this.mdStreetSuggestions = [];
      this.mdShowAddressDropdown = false;
      this.mdValidAddresses.clear();
      const addr = this.mainDriverGroup?.get('address');
      if (addr?.value) addr.setValue('', { emitEvent: false });
      addr?.updateValueAndValidity({ emitEvent: false });
    };
    this.mainDriverGroup.get('zip_code')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(reset);
    this.mainDriverGroup.get('area')!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(reset);
  }

  fillTestData(): void {
    this.form.patchValue({
      gender: 'Maschio', company_name: '', first_name: 'Dario', last_name: 'Sgamba',
      birth_date: '06.11.1993', first_driving_license_date: '06.11.2012',
      zip_code: '1000', area: 'Lausanne 25', address: '', address_number: '1',
      email: 'd.sgamba@hotmail.it', phone: '0722244451', nationality: 'CH',
      foreigners_id_type: '', language: 'de',
      main_driver_type: 'other',
      deductible_under_26: '0',
      n_certificate_1: '1VG324', car_brand_1: 'VW', car_model_1: 'Golf 2.0 TDI 5',
      serial_number_1: '', accessories_1: 1000, canton: 'VD',
      license_plate: '', first_registration_date_1: '06.11.2017',
      leasing_1: 'Si', garage_parking_1: 'Si', interchangeable_plate: 'No',
      vehicle_type_1: 'passenger_car', drive_1: 'Diesel', purchase_date_1: '12.2017',
      kilometers_per_year_1: '10000', current_mileage_1: 100000,
      reasons_for_redemption_1: 'Vehicle change', leasing_company_1: 'A+A Leasing AG',
      submit_vehicle_proof_1: 'Yes',
      vehicle_usage: 'nessun uso specifico', civil_insurance: 'Si inclusi alla mia proprieta',
      comprehensive_insurance: 'Totale', deductible_total_insurance: '1000',
      deductible_partial_insurance: '0', parking_damage_coverage: 'No',
      deductible_parking_damage: '', headlights_mirrors: 'Si',
      personal_belongings_coverage: '2000', tires_damage: 'No', bonus_protection: 'Si',
      roadside_assistance: 'Si', garage_free_choice: 'fissa', passenger_injury: 'No',
      ev_charging_station: false, ev_high_voltage_battery: false,
      ev_cyber_protection: false, ev_charging_cards_apps: false,
      payment_mode: 'Annuale', current_insurance: 'Baloise',
      n_rc_claims_5_years: '0', n_collisions_claims_5_years: '0',
      n_parking_claims_5_years: '0', n_glass_claims_5_years: '0',
      n_partial_comprehensive_claims_5_years: '0',
      n_rc_claims_3_years: '0', n_collisions_claims_3_years: '0',
      n_parking_claims_3_years: '0', n_glass_claims_3_years: '0',
      n_partial_comprehensive_claims_3_years: '0',
      source_user: '',
      other_q_terminated: false, other_q_refused: false, other_q_license_suspension: 'keine',
      recipient_email: this.publicMode ? 'd.sgamba@hotmail.it' : '', scrapers: [...this.availableScrapers],
      request_type: 'Vergleich Versicherungsangebote', registration_scraper: '',
    });
    this.applyRequestTypeValidators();
    (this.form.get('main_driver') as FormGroup).patchValue({
      gender: 'Maschio', first_name: 'Gioia', last_name: 'Sgamba',
      birth_date: '24.08.1999', first_driving_license_date: '05.08.2018',
      nationality: 'CH',
    });
    this.toasterService.success(this.i18nService.getTranslation('automation', 'form_test_loaded'));
  }
}
