# 03 — Wizard Setup EcoHub

**Stato**: ✅ Completato
**File creati**:
- `src/app/pages/automation-setup/automation-setup.component.ts`
- `src/app/pages/automation-setup/automation-setup.component.html`

> **Nota implementazione**: Il template usa la sintassi Angular 20 (`@if`/`@for`) invece di `*ngIf`/`*ngFor`. Il `canProceed()` allo step 2 verifica la presenza dell'immagine QR (`qr_image_base64` non vuoto) — il TOTP viene estratto al click di "Avanti". Gli errori usano `toasterService.warn()` (non `.error()` che non esiste nel servizio).

**Dipendenze**: `02-automation-service.md`

---

## Descrizione

Componente wizard a 3 step per la configurazione iniziale dell'account EcoHub del consulente.
Viene mostrato solo quando `checkLogin()` ritorna `false`.

---

## Struttura HTML (`automation-setup.component.html`)

```html
<div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-lg w-full max-w-xl p-8">

    <!-- Header -->
    <h1 class="text-2xl font-bold text-gray-800 mb-2">
      {{ 'automation.setup_title' | i18n }}
    </h1>
    <p class="text-gray-500 mb-6">
      Ciao <strong>{{ userName }}</strong>, per poter generare preventivi devi completare la seguente procedura guidata.
    </p>

    <!-- Barra di progresso -->
    <div class="flex items-center mb-8">
      <ng-container *ngFor="let s of [1,2,3]; let i = index">
        <div class="flex-1 h-2 rounded-full mx-1"
          [ngClass]="currentStep >= s ? 'bg-blue-600' : 'bg-gray-200'">
        </div>
      </ng-container>
    </div>
    <p class="text-sm text-gray-400 text-center mb-6">Step {{ currentStep }} di 3</p>

    <!-- STEP 1: Credenziali EcoHub -->
    <div *ngIf="currentStep === 1">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">
        {{ 'automation.step_credenziali' | i18n }}
      </h2>
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-600 mb-1">Username EcoHub</label>
        <input type="text" [(ngModel)]="form.username_eh"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Il tuo username EcoHub" />
      </div>
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-600 mb-1">Password EcoHub</label>
        <div class="relative">
          <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="form.password_eh"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="La tua password EcoHub" />
          <button type="button" (click)="showPassword = !showPassword"
            class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
            <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- STEP 2: QR Code 2FA -->
    <div *ngIf="currentStep === 2">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">
        {{ 'automation.step_qrcode' | i18n }}
      </h2>
      <ol class="list-decimal list-inside text-gray-600 space-y-2 mb-6 text-sm">
        <li>Apri EcoHub nel browser</li>
        <li>Effettua il login con le credenziali inserite</li>
        <li>Vai su <strong>Impostazioni</strong></li>
        <li>Clicca su <strong>Verifica a 2 fattori con Authenticator</strong></li>
        <li>Copia l'immagine del QR Code che ti viene mostrata</li>
        <li>Incollala nel riquadro qui sotto</li>
      </ol>

      <!-- Box paste QR Code -->
      <div
        (paste)="onQrPaste($event)"
        (click)="qrInput.click()"
        class="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4 min-h-[150px] flex flex-col items-center justify-center">
        <img *ngIf="qrPreview" [src]="qrPreview" class="max-h-40 mb-2" alt="QR Code" />
        <p *ngIf="!qrPreview" class="text-gray-400 text-sm">
          Incolla il QR Code qui (Ctrl+V / Cmd+V)<br/>
          oppure clicca per selezionare un file
        </p>
        <input #qrInput type="file" accept="image/*" (change)="onQrFileSelect($event)" class="hidden" />
      </div>

      <!-- Risultato TOTP estratto -->
      <div *ngIf="totpExtracted" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p class="text-green-700 text-sm font-medium">✓ TOTP estratto correttamente</p>
      </div>
      <div *ngIf="totpError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p class="text-red-700 text-sm">{{ totpError }}</p>
      </div>
    </div>

    <!-- STEP 3: Google Authenticator + OTP -->
    <div *ngIf="currentStep === 3">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">
        {{ 'automation.step_authenticator' | i18n }}
      </h2>
      <ol class="list-decimal list-inside text-gray-600 space-y-2 mb-6 text-sm">
        <li>Scarica l'app <strong>Google Authenticator</strong> sul tuo smartphone</li>
        <li>Apri l'app e aggiungi un nuovo account</li>
        <li>Scansiona il QR Code che hai copiato in precedenza</li>
        <li>Inserisci il codice a 6 cifre generato dall'app nel campo qui sotto</li>
        <li>Torna su EcoHub, incolla il codice e clicca <strong>Salva</strong></li>
      </ol>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-600 mb-1">Codice OTP (6 cifre)</label>
        <input type="text" [(ngModel)]="form.otp_code" maxlength="6"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="000000" />
      </div>

      <!-- Avviso sessione unica -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p class="text-yellow-800 text-sm">
          ⚠️ <strong>Importante:</strong> chiudi la pagina EcoHub dopo aver salvato.
          Si può usare una sessione EcoHub alla volta.
        </p>
      </div>
    </div>

    <!-- Bottoni navigazione -->
    <div class="flex justify-between mt-6">
      <button *ngIf="currentStep > 1" (click)="previousStep()"
        [disabled]="isLoading"
        class="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50">
        {{ 'automation.indietro' | i18n }}
      </button>
      <div *ngIf="currentStep === 1"></div><!-- spacer -->

      <button *ngIf="currentStep < 3" (click)="nextStep()"
        [disabled]="!canProceed() || isLoading"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span *ngIf="!isLoading">{{ 'automation.avanti' | i18n }}</span>
        <span *ngIf="isLoading" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12 0v4a8 8 0 00-8 8H0z"></path>
          </svg>
          Caricamento...
        </span>
      </button>

      <button *ngIf="currentStep === 3" (click)="onSubmit()"
        [disabled]="!canProceed() || isLoading"
        class="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <span *ngIf="!isLoading">{{ 'automation.invia' | i18n }}</span>
        <span *ngIf="isLoading">Invio in corso...</span>
      </button>
    </div>

  </div>
</div>
```

---

## Logica TypeScript (`automation-setup.component.ts`)

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AutomationService } from '../../services/automation.service';
import { NavigatorService } from '../../services/navigator.service';
import { ToasterService } from '../../services/toaster.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-automation-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe],
  templateUrl: './automation-setup.component.html'
})
export class AutomationSetupComponent implements OnInit {

  currentStep = 1;
  isLoading = false;
  showPassword = false;
  qrPreview: string | null = null;
  totpExtracted = false;
  totpError: string | null = null;
  userName = '';

  form = {
    username_eh: '',
    password_eh: '',
    qr_image_base64: '',
    totp_secret: '',
    otp_code: ''
  };

  constructor(
    private authService: AuthService,
    private automationService: AutomationService,
    private navigatorService: NavigatorService,
    private toasterService: ToasterService
  ) {}

  ngOnInit(): void {
    const contact = this.authService.userData?.contact;
    this.userName = contact
      ? `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim()
      : '';
  }

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return !!this.form.username_eh && !!this.form.password_eh;
    }
    if (this.currentStep === 2) {
      return this.totpExtracted;
    }
    if (this.currentStep === 3) {
      return this.form.otp_code.length === 6;
    }
    return false;
  }

  async nextStep(): Promise<void> {
    if (this.currentStep === 2) {
      await this.extractTotp();
      return; // nextStep viene chiamato solo dopo il successo dell'estrazione
    }
    this.currentStep++;
  }

  previousStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  // Paste immagine QR code
  onQrPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) this.readQrFile(file);
        break;
      }
    }
  }

  onQrFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.readQrFile(file);
  }

  private readQrFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      this.qrPreview = base64;
      this.form.qr_image_base64 = base64.split(',')[1]; // rimuove "data:image/png;base64,"
      this.totpExtracted = false;
      this.totpError = null;
    };
    reader.readAsDataURL(file);
  }

  private async extractTotp(): Promise<void> {
    if (!this.form.qr_image_base64) {
      this.totpError = 'Incolla prima il QR Code.';
      return;
    }
    this.isLoading = true;
    this.totpError = null;
    try {
      const result = await firstValueFrom(
        this.automationService.extractTotp({ qr_image_base64: this.form.qr_image_base64 })
      );
      this.form.totp_secret = result.totp;
      this.totpExtracted = true;
      this.currentStep = 3;
    } catch {
      this.totpError = 'Impossibile estrarre il TOTP. Verifica che l\'immagine sia corretta.';
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    const consultantId = String(this.authService.userData?.contact?.id ?? '');
    this.isLoading = true;
    try {
      const result = await firstValueFrom(
        this.automationService.setupEcoHub({
          consultant_id: consultantId,
          username_eh: this.form.username_eh,
          password_eh: this.form.password_eh,
          totp_secret: this.form.totp_secret,
          otp_code: this.form.otp_code
        })
      );
      if (result.success) {
        this.toasterService.success('automation.success');
        setTimeout(() => this.navigatorService.navigateTo('/automation-form'), 1500);
      } else {
        this.toasterService.error(result.message ?? 'automation.error_generic');
      }
    } catch {
      this.toasterService.error('automation.error_generic');
    } finally {
      this.isLoading = false;
    }
  }
}
```
