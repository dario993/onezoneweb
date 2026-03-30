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
import { ToasterService } from '../../services/toaster.service';
import { LoaderService } from '../../services/loader.service';
import { I18nService } from '../../services/i18n.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { firstValueFrom } from 'rxjs';
import { LocalityEntry } from '../../interfaces/automation.interface';
import { HttpErrorResponse } from '@angular/common/http';

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
  carBrandOptions = [
    'Alfa Romeo','Alpine','Aston Martin','Audi','Bentley','BMW','Bugatti','Buick',
    'Cadillac','Chevrolet','Chrysler','Citroën','Cupra','Dacia','Daewoo','Daihatsu',
    'Daimler','Dodge','Dongfeng','DS','Elaris','Ferrari','Fiat','Fisker','Ford',
    'GMC','Genesis','Honda','Hummer','Hyundai','Infiniti','Isuzu','Iveco','Jaguar',
    'Jeep','Kia','KTM','Lamborghini','Lancia','Land Rover','Lexus','Lincoln','Lotus',
    'Mazda','Maserati','Maybach','McLaren','Mercedes-Benz','Mercury','MG','Mini',
    'Mitsubishi','Morgan','Nissan','Oldsmobile','Opel','Panoz','Peugeot','Plymouth',
    'Polestar','Pontiac','Porsche','Ram','Renault','Rolls-Royce','Rover','Saab',
    'Ssang Yong','Seat','Smart','Škoda','Subaru','Suzuki','Puch','Tesla','Toyota',
    'Triumph','TVR','VW - Volkswagen','Volvo','Wiesmann','Zagato',
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
  claimsOptions = ['0', '1', '2', '3'];
  isTestMode = true;

  // Autocomplete PLZ / Località
  plzSuggestions: LocalityEntry[] = [];
  areaSuggestions: LocalityEntry[] = [];
  showPlzDropdown = false;
  showAreaDropdown = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly automationService: AutomationService,
    private readonly toasterService: ToasterService,
    private readonly loaderService: LoaderService,
    private readonly i18nService: I18nService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.setupConditionalFields();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Sezione 1: Info Personali
      gender: ['Maschio', Validators.required],
      company_name: [''],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      birth_date: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)]],
      first_driving_license_date: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)]],
      zip_code: ['', [Validators.required, Validators.pattern(/^\d{4}$/), this.plzExistsValidator.bind(this)]],
      area: ['', [Validators.required, this.areaExistsValidator.bind(this)]],
      address: ['', Validators.required],
      address_number: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
      nationality: ['CH', Validators.required],
      foreigners_id_type: [''],
      language: ['de', Validators.required],

      // Sezione 2: Veicolo 1
      deductible_under_26: ['0'],
      n_certificate_1: [''],
      car_brand_1: ['', Validators.required],
      car_model_1: ['', Validators.required],
      serial_number_1: ['', Validators.required],
      accessories_1: [null],
      canton: ['ZH', Validators.required],
      license_plate: [''],
      first_registration_date_1: ['', [Validators.required, Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)]],
      leasing_1: ['No', Validators.required],
      garage_parking_1: ['Si', Validators.required],
      interchangeable_plate: ['No', Validators.required],

      // Sezione 3: Veicolo 2
      n_certificate_2: [''],
      car_brand_2: [''],
      car_model_2: [''],
      accessories_2: [null],
      serial_number_2: [''],
      first_registration_date_2: ['', Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)],
      leasing_2: ['No'],
      garage_parking_2: ['Si'],

      // Sezione 4: Opzioni Assicurative
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

      // Sezione 5: Storico Sinistri
      current_insurance: ['Baloise', Validators.required],
      n_rc_claims_5_years: ['0', Validators.required],
      n_collisions_claims_5_years: ['0', Validators.required],
      n_parking_claims_5_years: ['0', Validators.required],
      n_glass_claims_5_years: ['0', Validators.required],
      n_partial_comprehensive_claims_5_years: ['0', Validators.required],

      // Campi aggiuntivi
      other_questions: [''],
      recipient_email: ['automate@onezone.ch'],
      scrapers: [[]],
    });
  }

  private setupConditionalFields(): void {
    // company_name obbligatorio se gender = Azienda
    this.form.get('gender')!.valueChanges.subscribe((val) => {
      const ctrl = this.form.get('company_name')!;
      if (val === 'Azienda') {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity();
    });

    // foreigners_id_type obbligatorio se nationality != CH
    this.form.get('nationality')!.valueChanges.subscribe((val) => {
      const ctrl = this.form.get('foreigners_id_type')!;
      if (val && val.toUpperCase() !== 'CH') {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity();
    });

    // Veicolo 2: campi obbligatori se interchangeable_plate = Si
    this.form.get('interchangeable_plate')!.valueChanges.subscribe((val) => {
      const fields = [
        'car_brand_2','car_model_2','serial_number_2',
        'first_registration_date_2','leasing_2','garage_parking_2',
      ];
      fields.forEach((f) => {
        const ctrl = this.form.get(f)!;
        if (val === 'Si') {
          ctrl.setValidators(Validators.required);
        } else {
          ctrl.clearValidators();
        }
        ctrl.updateValueAndValidity();
      });
    });

    // Leasing forza comprehensive_insurance = Totale
    const checkLeasing = () => {
      const l1 = this.form.get('leasing_1')!.value;
      const l2 = this.form.get('leasing_2')!.value;
      if (l1 === 'Si' || l2 === 'Si') {
        this.form.get('comprehensive_insurance')!.setValue('Totale');
      }
    };
    this.form.get('leasing_1')!.valueChanges.subscribe(checkLeasing);
    this.form.get('leasing_2')!.valueChanges.subscribe(checkLeasing);

    // Deductible condizionali su comprehensive_insurance
    this.form.get('comprehensive_insurance')!.valueChanges.subscribe((val) => {
      const total = this.form.get('deductible_total_insurance')!;
      const partial = this.form.get('deductible_partial_insurance')!;
      if (val === 'Totale') {
        total.setValidators(Validators.required);
        partial.setValidators(Validators.required);
      } else if (val === 'Parziale') {
        total.clearValidators();
        partial.setValidators(Validators.required);
      } else {
        total.clearValidators();
        partial.clearValidators();
      }
      total.updateValueAndValidity();
      partial.updateValueAndValidity();
    });

    // Deductible parking condizionale
    this.form.get('parking_damage_coverage')!.valueChanges.subscribe((val) => {
      const ctrl = this.form.get('deductible_parking_damage')!;
      if (val && val !== 'No') {
        ctrl.setValidators(Validators.required);
      } else {
        ctrl.clearValidators();
      }
      ctrl.updateValueAndValidity();
    });
  }

  get showVehicle2(): boolean {
    return this.form.get('interchangeable_plate')?.value === 'Si';
  }
  get showForeignersId(): boolean {
    const val = this.form.get('nationality')?.value;
    return val && val.toUpperCase() !== 'CH';
  }
  get showCompanyName(): boolean {
    return this.form.get('gender')?.value === 'Azienda';
  }
  get showDeductibleTotal(): boolean {
    return this.form.get('comprehensive_insurance')?.value === 'Totale';
  }
  get showDeductiblePartial(): boolean {
    return ['Totale', 'Parziale'].includes(
      this.form.get('comprehensive_insurance')?.value
    );
  }
  get showDeductibleParking(): boolean {
    return this.form.get('parking_damage_coverage')?.value !== 'No';
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
    if (ctrl.hasError('email')) return this.i18nService.getTranslation('automation', 'form_err_email');
    if (ctrl.hasError('pattern')) {
      const dateFields = ['birth_date', 'first_driving_license_date', 'first_registration_date_1', 'first_registration_date_2'];
      if (dateFields.includes(name)) return this.i18nService.getTranslation('automation', 'form_err_date_format');
      return this.i18nService.getTranslation('automation', 'form_err_invalid_format');
    }
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
    if (inputEvent.inputType !== 'deleteContentBackward' && (digits.length === 2 || digits.length === 4)) {
      formatted += '.';
    }
    input.value = formatted;
    this.form.get(controlName)?.setValue(formatted, { emitEvent: false });
  }

  ngOnDestroy(): void {}

  async onSubmit(): Promise<void> {
    this.submitted = true;
    if (this.form.invalid) {
      this.toasterService.warn(this.i18nService.getTranslation('automation', 'form_err_fill_required'));
      return;
    }
    const { ev_charging_station, ev_high_voltage_battery, ev_cyber_protection, ev_charging_cards_apps, ...rest } = this.form.value;
    const payload = {
      ...rest,
      electric_vehicle: {
        'stazione di ricarica e accessori': !!ev_charging_station,
        'batterie alta tensione': !!ev_high_voltage_battery,
        'protezione informatica': !!ev_cyber_protection,
        'protezione carte ricarica e app': !!ev_charging_cards_apps,
      },
    };

    this.loaderService.show();
    try {
      await firstValueFrom(
        this.automationService.submitQuoteRequest(payload)
      );
      this.submittedEmail = this.form.get('email')?.value || '';
      this.submitSuccess = true;
      this.loaderService.hide();
    } catch (err) {
      this.loaderService.hide();
      if (err instanceof HttpErrorResponse && err.status === 429) {
        this.toasterService.warn(
          this.i18nService.getTranslation('automation', 'error_pool_full')
        );
      } else {
        this.toasterService.warn(
          this.i18nService.getTranslation('automation', 'error_generic')
        );
      }
    }
  }

  private areaExistsValidator(control: AbstractControl): ValidationErrors | null {
    const area = control.value?.toString().trim() || '';
    if (!area) return null;
    const plz = this.form?.get('zip_code')?.value?.toString() || '';
    if (plz.length !== 4) return null;
    const localities = this.automationService.getLocalitiesByPlz(plz);
    const found = localities.some((l) => l.locality === area);
    return found ? null : { areaNotFound: true };
  }

  private plzExistsValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value?.toString() || '';
    if (val.length !== 4) return null;
    const results = this.automationService.getLocalitiesByPlz(val);
    return results.length > 0 ? null : { plzNotFound: true };
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
    this.form.patchValue({
      zip_code: entry.plz,
      area: entry.locality,
      canton: entry.canton,
    });
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
    this.form.patchValue({
      area: entry.locality,
      canton: entry.canton,
    });
    this.showAreaDropdown = false;
    this.areaSuggestions = [];
  }

  hidePlzDropdown(): void {
    setTimeout(() => this.showPlzDropdown = false, 200);
  }

  hideAreaDropdown(): void {
    setTimeout(() => this.showAreaDropdown = false, 200);
  }

  fillTestData(): void {
    this.form.patchValue({
      gender: 'Maschio',
      company_name: '',
      first_name: 'Dario',
      last_name: 'Sgamba',
      birth_date: '06.11.1993',
      first_driving_license_date: '01.08.2010',
      zip_code: '8001',
      area: 'Zürich',
      address: 'Via Roma',
      address_number: '1',
      email: 'dario.sgamba@gmail.com',
      phone: '0791234567',
      nationality: 'CH',
      foreigners_id_type: 'C',
      language: 'it',
      deductible_under_26: '5000',
      n_certificate_1: '',
      car_brand_1: 'VW - Volkswagen',
      car_model_1: 'Multivan T7',
      serial_number_1: '149447880',
      accessories_1: null,
      canton: 'ZH',
      license_plate: '711121',
      first_registration_date_1: '05.05.2021',
      leasing_1: 'Si',
      garage_parking_1: 'Si',
      interchangeable_plate: 'No',
      vehicle_usage: 'nessun uso specifico',
      civil_insurance: 'Si inclusi alla mia proprieta',
      comprehensive_insurance: 'Totale',
      deductible_total_insurance: '1000',
      deductible_partial_insurance: '0',
      parking_damage_coverage: 'Illimitato',
      deductible_parking_damage: '200',
      headlights_mirrors: 'Si',
      personal_belongings_coverage: '2000',
      tires_damage: 'Si',
      bonus_protection: 'Si',
      roadside_assistance: 'Si',
      garage_free_choice: 'fissa',
      passenger_injury: 'No',
      ev_charging_station: false,
      ev_high_voltage_battery: false,
      ev_cyber_protection: false,
      ev_charging_cards_apps: false,
      payment_mode: 'Annuale',
      current_insurance: 'AXA',
      n_rc_claims_5_years: '0',
      n_collisions_claims_5_years: '0',
      n_parking_claims_5_years: '0',
      n_glass_claims_5_years: '0',
      n_partial_comprehensive_claims_5_years: '0',
      other_questions: '',
      recipient_email: 'dario.sgamba@gmail.com',
      scrapers: [],
    });
    this.toasterService.success(this.i18nService.getTranslation('automation', 'form_test_loaded'));
  }

}
