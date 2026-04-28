import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'page-form-mandate-wefox',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-mandate-wefox.component.html',
})
export class FormMandateWefoxComponent implements OnInit {
  form!: FormGroup;
  submitted = false;
  submitSuccess = false;

  mandatFile: File | null = null;
  ausweisFile: File | null = null;

  showCompanyName = true;

  insuranceCompanies = [
    'Allianz', 'ASGA', 'Automate', 'AXA', 'Baloise', 'Belsura',
    'Coop RSV', 'Dextra', 'Elips', 'Emilia', 'Emmental', 'Generali',
    'Groupe Mutuel', 'GVB Gebäude', 'Helsana', 'Helvetia', 'Innova',
    'Liberty', 'Mobiliar', 'ÖKK', 'Orion', 'PAX', 'PK Pro - Tellco',
    'Profond', 'Protekta', 'Simpego', 'Smile', 'Solida', 'Swica',
    'Swiss Life', 'Sympany', 'TSM', 'Vaudoise', 'Valitas', 'Visana',
    'Zürich',
  ];

  selectedInsurances: string[] = [];

  beraterOptions = [
    'Arfaoui Hamdi - F01493007',
    'Belotti Mélissa - F01539915',
    'Ben Hassine Hedi - F01494126',
    'Bouazzi Samira - F01492898',
    'Bouzerzour Sabrina - F01463091',
    'Braham Michael - F01397752',
    'Brancaccio Giulia - F01495141',
    'Carrubba Rosario - F01495135',
    'Cereja Eden - F01502195',
    'Correia Telma - F01541711',
    'Cotardo Giada - F01495023',
    'Debrunner Monika - F01070186',
    'Debrunner Rahel Sabine - F01538885-',
    'Elkaz Osman - F01104534',
    'Fofana Sagiie - F01543810',
    'Francione Francesca - F01495021',
    'Ghaffouri Hiwa - F01495338',
    'Ghemame Youness - F01539918',
    'Gonçalves Nuno - F01528811',
    'Goodwin Jay Samuel - F01558085',
    'Guislain Sarra - F01465244',
    'Hamira Brahim - F01528580',
    'Hipolito Dos Santos Filipe Miguel - F01114946',
    'Jashari Arbnor - F01544452',
    'Kathirgamu Sabisanth - F01494971',
    'Künzli Pascal - F01544454',
    'Kuqi Skender - F01495715',
    'Lopes Eric - F01539763',
    'Mahmuti Vlera - F01545749',
    'Marguiron Yanis - F01543808',
    'Mathez Christian Stéphane - F01259903',
    'Meepagama Dishan - F01490838',
    'Merabti Ziad - F01538571',
    'Micocci Roberta - F01495144',
    'Miftari Aridon - F01530201',
    'Montalbano Federica - F01514853',
    'Münger Andrej - F01537198',
    'Naji Youssef - F01527850',
    "N'guessan Money - F01529512",
    'Noufir Rida - F01521034',
    'Paternicola Concetta - F01540211',
    'Pereira João Manuel - F01528829',
    'Pereira Correia Tiago José - F01536992',
    'Roux Pierre-Olivier - F01465246',
    'Stevenazzi Mafalda - F01495019',
    'Sucurovic Vlada - F01506624',
    'Syhora Cyril - F01544450',
    'Tedla Ebenezer - F01437123',
    'Tevisio Ilaria - F01495207',
    'Travaglini Alessandro - F01495137',
    'Tyurin Mikhail - F01539658',
    'Vijayakumar Lugishan - F01495620',
    'Wymann Yoshi - F01525518',
    'Zodio Matteo - F01495222',
    'Zogib Melissa - F01538950',
    'Zogib Amir - F01364912',
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      anrede: ['Firma', Validators.required],
      firmenname: [''],
      vorname: ['', Validators.required],
      nachname: ['', Validators.required],
      strasse: ['', Validators.required],
      hausnummer: ['', Validators.required],
      plz: ['', Validators.required],
      ort: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', Validators.required],
      berater: [this.beraterOptions[0]],
    });

    this.form.get('anrede')?.valueChanges.subscribe((value: string) => {
      this.showCompanyName = value === 'Firma';
      const firmenname = this.form.get('firmenname');
      if (this.showCompanyName) {
        firmenname?.setValidators(Validators.required);
      } else {
        firmenname?.clearValidators();
        firmenname?.setValue('');
      }
      firmenname?.updateValueAndValidity();
    });
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched || this.submitted));
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors || !(control.dirty || control.touched || this.submitted)) return '';
    if (control.errors['required']) return 'Dieses Feld ist erforderlich';
    if (control.errors['email']) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
    return '';
  }

  onFileSelected(event: Event, type: 'mandat' | 'ausweis'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      if (type === 'mandat') {
        this.mandatFile = input.files[0];
      } else {
        this.ausweisFile = input.files[0];
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent, type: 'mandat' | 'ausweis'): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      if (type === 'mandat') {
        this.mandatFile = event.dataTransfer.files[0];
      } else {
        this.ausweisFile = event.dataTransfer.files[0];
      }
    }
  }

  removeFile(type: 'mandat' | 'ausweis', event: Event): void {
    event.stopPropagation();
    if (type === 'mandat') {
      this.mandatFile = null;
    } else {
      this.ausweisFile = null;
    }
  }

  onInsuranceChange(company: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedInsurances.push(company);
    } else {
      this.selectedInsurances = this.selectedInsurances.filter(c => c !== company);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    const formData = {
      ...this.form.value,
      versicherungsgesellschaften: this.selectedInsurances,
      mandatFile: this.mandatFile,
      ausweisFile: this.ausweisFile,
    };

    console.log('Mandate form data:', formData);
    this.submitSuccess = true;
  }
}
