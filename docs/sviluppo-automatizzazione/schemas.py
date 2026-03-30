"""
User Schema with validation for insurance quote requests.
All field names and enum values match the API exactly.
"""
import re
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Optional, Any
from enum import Enum
from datetime import datetime


# --- Enums ---

class Gender(str, Enum):
    MASCHIO = "Maschio"
    FEMMINA = "Femmina"
    AZIENDA = "Azienda"


class Language(str, Enum):
    IT = "it"
    EN = "en"
    DE = "de"
    FR = "fr"


class SiNo(str, Enum):
    SI = "Si"
    NO = "No"


class ForeignersIdType(str, Enum):
    B = "B"
    C = "C"
    S = "S"
    CI = "Ci"
    F = "F"
    G = "G"
    N = "N"


class Canton(str, Enum):
    AG = "AG"
    AI = "AI"
    AR = "AR"
    BE = "BE"
    BL = "BL"
    BS = "BS"
    FR = "FR"
    GE = "GE"
    GL = "GL"
    GR = "GR"
    JU = "JU"
    LU = "LU"
    NE = "NE"
    NW = "NW"
    OW = "OW"
    SG = "SG"
    SH = "SH"
    SO = "SO"
    SZ = "SZ"
    TG = "TG"
    TI = "TI"
    UR = "UR"
    VD = "VD"
    VS = "VS"
    ZG = "ZG"
    ZH = "ZH"


class DeductibleUnder26(str, Enum):
    # if yes put the min deductible, otherwise the value specified in the class
    SI = "Si"
    D0 = "0"
    D1000 = "1000"
    D2000 = "2000"
    D3000 = "3000"
    D5000 = "5000"


class VehicleUsage(str, Enum):
    NESSUN_USO = "nessun uso specifico"
    TRASPORTO_MERCI = "trasporto merci"
    CORRIERE = "corriere"
    TRASPORTO_PASSEGGERI = "trasporto passeggeri"
    TAXI = "taxi"
    SCUOLA_GUIDA = "scuola guida"
    NOLEGGIO = "noleggio"


class CivilInsurance(str, Enum):
    ESCLUSI = "Si esclusi alla mia proprieta"
    INCLUSI = "Si inclusi alla mia proprieta"
    NO = "No"


class ComprehensiveInsurance(str, Enum):
    TOTALE = "Totale"
    PARZIALE = "Parziale"
    NESSUNA = "Nessuna"


class DeductibleTotal(str, Enum):
    D500 = "500"
    D1000 = "1000"
    D2000 = "2000"


class DeductiblePartial(str, Enum):
    D0 = "0"
    D200 = "200"
    D500 = "500"
    D1000 = "1000"


class ParkingDamageCoverage(str, Enum):
    ILLIMITATO = "Illimitato"
    D2000 = "2000"
    D1000 = "1000"
    NO = "No"


class DeductibleParking(str, Enum):
    D0 = "0"
    D200 = "200"
    D500 = "500"


class PersonalBelongings(str, Enum):
    NO = "No"
    D2000 = "2000"
    D3000 = "3000"
    D5000 = "5000"


class GarageFreeChoice(str, Enum):
    FISSA = "fissa"
    SCELTA = "scelta"


class PaymentMode(str, Enum):
    ANNUALE = "Annuale"
    SEMESTRALE = "Semestrale"


class ClaimsCount(str, Enum):
    C0 = "0"
    C1 = "1"
    C2 = "2"
    C3 = "3"


class ElectricVehicleOptions(BaseModel):
    model_config = ConfigDict(extra='forbid', populate_by_name=True)
    stazione_di_ricarica_e_accessori: bool = Field(default=False, alias="stazione di ricarica e accessori")
    batterie_alta_tensione: bool = Field(default=False, alias="batterie alta tensione")
    protezione_informatica: bool = Field(default=False, alias="protezione informatica")
    protezione_carte_ricarica_e_app: bool = Field(default=False, alias="protezione carte ricarica e app")


# --- User Schema ---

class UserSchema(BaseModel):
    model_config = ConfigDict(extra='forbid', populate_by_name=True)

    # Personal Info 15
    gender: Gender
    company_name: Optional[str] = ""
    first_name: str
    last_name: str
    birth_date: str
    first_driving_license_date: str
    zip_code: str
    canton: Canton
    area: str
    address: str
    address_number: str
    email: str
    phone: str
    nationality: str
    foreigners_id_type: Optional[ForeignersIdType] = None
    language: Language

    # Vehicle 1 11
    deductible_under_26: Optional[DeductibleUnder26] = None
    n_certificate_1: Optional[str] = ""
    car_brand_1: str
    car_model_1: str
    accessories_1: Optional[int] = None
    serial_number_1: str
    first_registration_date_1: str
    leasing_1: SiNo
    garage_parking_1: SiNo
    license_plate: Optional[str] = ""
    interchangeable_plate: SiNo

    # Vehicle 2 (conditional) 8
    n_certificate_2: Optional[str] = ""
    car_brand_2: Optional[str] = ""
    car_model_2: Optional[str] = ""
    accessories_2: Optional[int] = None
    serial_number_2: Optional[str] = ""
    first_registration_date_2: Optional[str] = ""
    leasing_2: Optional[SiNo] = None
    garage_parking_2: Optional[SiNo] = None

    # Insurance Options 16
    vehicle_usage: VehicleUsage
    civil_insurance: CivilInsurance
    comprehensive_insurance: ComprehensiveInsurance # casco
    deductible_partial_insurance: Optional[DeductiblePartial] = None
    deductible_total_insurance: Optional[DeductibleTotal] = None
    parking_damage_coverage: Optional[ParkingDamageCoverage] = None
    deductible_parking_damage: Optional[DeductibleParking] = None
    headlights_mirrors: SiNo
    personal_belongings_coverage: PersonalBelongings
    tires_damage: SiNo
    bonus_protection: SiNo
    roadside_assistance: SiNo
    garage_free_choice: GarageFreeChoice
    passenger_injury: SiNo
    electric_vehicle: ElectricVehicleOptions = Field(default_factory=ElectricVehicleOptions)
    payment_mode: PaymentMode

    # Claims History 7
    current_insurance: str
    n_rc_claims_5_years: ClaimsCount
    n_collisions_claims_5_years: ClaimsCount
    n_parking_claims_5_years: ClaimsCount
    n_glass_claims_5_years: ClaimsCount
    n_partial_comprehensive_claims_5_years: ClaimsCount
    other_questions: Optional[str] = ""

    # --- Validators ---

    @field_validator('*', mode='before')
    @classmethod
    def coerce_to_string_and_clean(cls, v: Any) -> Any:
        """Convert None/NaN to None, let Pydantic handle defaults/types."""
        if v is None or str(v) == 'NaT' or v == "":
            return None
        if isinstance(v, (int, float)):
            if isinstance(v, float) and v.is_integer():
                return str(int(v))
            return str(v)
        return v

    @field_validator('first_name', 'last_name', mode='before')
    @classmethod
    def capitalize_names(cls, v):
        if isinstance(v, str):
            return v.strip().title()
        return v

    @field_validator('birth_date', 'first_driving_license_date', 'first_registration_date_1',
                     'first_registration_date_2', mode='before')
    @classmethod
    def normalize_date(cls, v):
        """Normalize dates to DD.MM.YYYY format."""
        if v is None or str(v) == 'NaT' or v == "":
            return ""
        if hasattr(v, 'strftime'):
            return v.strftime("%d.%m.%Y")
        if not isinstance(v, str):
            return str(v) if v else ""
        v = v.strip()
        for fmt in ("%d.%m.%Y", "%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%d %H:%M:%S"):
            try:
                dt = datetime.strptime(v, fmt)
                return dt.strftime("%d.%m.%Y")
            except ValueError:
                continue
        return v

    @field_validator('electric_vehicle', mode='before')
    @classmethod
    def parse_electric_vehicle(cls, v: Any) -> dict[str, bool]:
        """Parse comma-separated string of electric vehicle options into a dict."""
        default_options = {
            "stazione di ricarica e accessori": False,
            "batterie alta tensione": False,
            "protezione informatica": False,
            "protezione carte ricarica e app": False
        }
        if not v or not isinstance(v, str):
            return default_options

        selected_options = [opt.strip() for opt in v.split(',')]
        for opt in selected_options:
            if opt in default_options:
                default_options[opt] = True
        return default_options

    @model_validator(mode='after')
    def check_complex_constraints(self) -> 'UserSchema':
        # Helper for "populated" check
        def is_populated(v: Any) -> bool:
            return v is not None and v != ""

        # 1. Company Logic
        if self.gender == Gender.AZIENDA and not is_populated(self.company_name):
            raise ValueError("Company name must be populated if gender is Azienda")

        # 2. Foreigners Logic
        if self.nationality and self.nationality.upper() != "CH" and not is_populated(self.foreigners_id_type):
            self.foreigners_id_type = ForeignersIdType.B

        # 3. Interchangeable Plate
        if self.interchangeable_plate == SiNo.SI:
            # Check all required fields for vehicle 2
            check_fields = [
                self.car_brand_2, self.car_model_2,
                self.serial_number_2, self.first_registration_date_2,
                self.leasing_2, self.garage_parking_2
            ]
            for field_val in check_fields:
                if not is_populated(field_val):
                    raise ValueError("All vehicle 2 fields must be populated if interchangeable plate is Si")

        # 4. Comprehensive Insurance & Leasing
        is_leasing_1 = (self.leasing_1 == SiNo.SI)
        is_leasing_2 = (self.leasing_2 == SiNo.SI)

        if is_leasing_1 or is_leasing_2:
            if self.comprehensive_insurance != ComprehensiveInsurance.TOTALE:
                self.comprehensive_insurance = ComprehensiveInsurance.TOTALE

        # Deductible checks
        if self.comprehensive_insurance == ComprehensiveInsurance.TOTALE:
            if not is_populated(self.deductible_total_insurance):
                raise ValueError("Deductible own vehicle damage must be populated if comprehensive insurance is Totale")

        if self.comprehensive_insurance in [ComprehensiveInsurance.TOTALE, ComprehensiveInsurance.PARZIALE]:
            if not is_populated(self.deductible_partial_insurance):
                raise ValueError(
                    "Deductible comprehensive insurance must be populated if insurance is Totale or Parziale")

        # 5. Parking Damage
        if self.parking_damage_coverage and self.parking_damage_coverage != ParkingDamageCoverage.NO:
            if not is_populated(self.deductible_parking_damage):
                raise ValueError("Deductible parking damage must be populated if parking damage coverage is active")

        return self

    # --- Utility Methods for Scrapers ---

    def to_dict(self) -> dict:
        """Returns the data as a dictionary."""
        return self.model_dump()

    def get_gender_display(self) -> str:
        mapping = {"Maschio": "maschile", "Femmina": "femminile", "Azienda": "maschile"}
        return mapping.get(self.gender.value, self.gender.value)

    def get_language_name(self) -> str:
        mapping = {"it": "italiano", "de": "tedesco", "fr": "francese", "en": "inglese"}
        return mapping.get(self.language.value, self.language.value)

    def get_nationality_name(self) -> str:
        mapping = {"CH": "Svizzera", "IT": "Italia", "FR": "Francia", "DE": "Germania"}
        return mapping.get(self.nationality.upper(), self.nationality)

    def get_cantone_name(self) -> str:
        mapping = {
            "AG": "Aargau", "AI": "Inner-Rhoden", "AR": "Ausser-Rhoden", "BE": "Berna",
            "BL": "Basilea - regione", "BS": "Basilea - città", "FR": "Friburgo",
            "GE": "Ginevra", "GL": "Glarus", "GR": "Cantone dei Grigioni", "JU": "Giura",
            "LU": "Lucerna", "NE": "Neuchatel", "NW": "Nidwalden", "OW": "Obwalden",
            "SG": "St. Gallen", "SH": "Sciaffusa", "SO": "Solothurn", "SZ": "Schwyz",
            "TG": "Thurgau", "TI": "Ticino", "UR": "Uri", "VD": "Vaud", "VS": "Valais",
            "ZG": "Zug", "ZH": "Zurigo"
        }
        return mapping.get(self.canton.value, self.canton.value)

    @staticmethod
    def get_chf_display(value) -> str:
        """
        Format a numeric string (or number) inserting an apostrophe every 3 digits in the integer part.
        Examples: 12000 -> 12'000, 500 -> 500, -1234567.89 -> -1'234'567.89
        """

        # Extract enum value if it's an enum
        if hasattr(value, 'value'):
            s = str(value.value)
        else:
            s = str(value)
        if not s:
            return s
        sign = ''
        if s[0] in '+-':
            sign, s = s[0], s[1:]
        if '.' in s:
            int_part, frac = s.split('.', 1)
        else:
            int_part, frac = s, None
        # remove any non-digit characters from integer part (commas, spaces, apostrophes)
        int_part = re.sub(r'\D', '', int_part)
        if int_part == '':
            int_part = '0'
        parts = []
        while len(int_part) > 3:
            parts.append(int_part[-3:])
            int_part = int_part[:-3]
        parts.append(int_part)
        int_formatted = "'".join(reversed(parts))
        return f"{sign}{int_formatted}" + (f".{frac}" if frac is not None else "")


# --- Date Utility Functions ---

def get_year(date_str) -> int | None:
    """Extract year from date string (DD.MM.YYYY or YYYY)."""
    if not date_str:
        return None
    try:
        if '.' in str(date_str):
            return int(str(date_str).split('.')[-1])
        return int(date_str)
    except (ValueError, AttributeError):
        return None


def calculate_vehicle_age(first_registration_date: str) -> int:
    """
    Calculate vehicle age in years from first registration date.

    Args:
        first_registration_date: Date string in format DD.MM.YYYY or YYYY

    Returns:
        Vehicle age in years
    """
    try:
        year = get_year(first_registration_date)
        if year is None:
            return 0
        current_year = datetime.now().year
        return current_year - year
    except Exception:
        return 0
