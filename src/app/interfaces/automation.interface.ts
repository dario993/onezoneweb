export interface LocalityEntry {
  locality: string;
  plz: string;
  canton: string;
}

export interface CheckLoginResponse {
  status: 'verified' | 'failed' | 'already_verified' | 'error';
  login_check: boolean;
  error?: string;
}

export interface EcoHubSetupPayload {
  consultant_id: string;
  ecohub_username: string;
  ecohub_password: string;
  ecohub_totp_secret?: string;
}

export interface GetConsultantResponse {
  id: number;
  onezone_id: string;
  api_key: string;
  name: string;
  surname: string;
  commission_number?: string;
  registration_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractTotpPayload {
  qr_image: File;
}

export interface ExtractTotpResponse {
  secret: string;
  issuer: string;
  name: string;
}

export interface ConsultantRegistrationPayload {
  onezone_id: string;
  name?: string;
  surname?: string;
  ecohub_username?: string;
  ecohub_password?: string;
  ecohub_totp_secret?: string;
  commission_number?: string;
  registration_number?: string;
}

export interface ConsultantRegistrationResponse {
  status: 'created';
  onezone_id: string;
  api_key: string;
}

export interface CredentialsUpdateResponse {
  status: 'updated';
  onezone_id: string;
}

export interface GenerateQuotesResponse {
  status: 'accepted';
  request_id: number;
  message: string;
}

export interface QuoteRequestStatus {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuoteRequestPayload {
  // Sezione 1 - Info Personali
  gender: string;
  company_name?: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  first_driving_license_date: string;
  zip_code: string;
  canton: string;
  area: string;
  address: string;
  address_number: string;
  email: string;
  phone: string;
  nationality: string;
  foreigners_id_type?: string;
  marital_status?: string;
  language: string;
  // Sezione 2 - Veicolo 1
  deductible_under_26?: string;
  n_certificate_1?: string;
  car_brand_1: string;
  car_model_1: string;
  accessories_1?: number;
  serial_number_1: string;
  first_registration_date_1: string;
  leasing_1: string;
  garage_parking_1: string;
  license_plate?: string;
  interchangeable_plate: string;
  // Sezione 3 - Veicolo 2 (opzionale)
  n_certificate_2?: string;
  car_brand_2?: string;
  car_model_2?: string;
  accessories_2?: number;
  serial_number_2?: string;
  first_registration_date_2?: string;
  leasing_2?: string;
  garage_parking_2?: string;
  // Sezione 4 - Opzioni Assicurative
  vehicle_usage: string;
  civil_insurance: string;
  comprehensive_insurance: string;
  deductible_partial_insurance?: string;
  deductible_total_insurance?: string;
  parking_damage_coverage?: string;
  deductible_parking_damage?: string;
  headlights_mirrors: string;
  personal_belongings_coverage: string;
  tires_damage: string;
  bonus_protection: string;
  roadside_assistance: string;
  garage_free_choice: string;
  passenger_injury: string;
  electric_vehicle: {
    'stazione di ricarica e accessori': boolean;
    'batterie alta tensione': boolean;
    'protezione informatica': boolean;
    'protezione carte ricarica e app': boolean;
  };
  payment_mode: string;
  // Sezione 5 - Storico Sinistri
  current_insurance: string;
  n_rc_claims_5_years: string;
  n_collisions_claims_5_years: string;
  n_parking_claims_5_years: string;
  n_glass_claims_5_years: string;
  n_partial_comprehensive_claims_5_years: string;
  other_questions?: string;
  // Opzionale
  recipient_email?: string;
  scrapers?: string[];
  [key: string]: any;
}
