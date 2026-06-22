import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AutomationService } from '../../services/automation.service';
import { NavigatorService } from '../../services/navigator.service';
import { ToasterService } from '../../services/toaster.service';
import { StorageService } from '../../services/storage.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { firstValueFrom, timeout } from 'rxjs';

@Component({
  selector: 'page-automation-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe],
  templateUrl: './automation-setup.component.html',
})
export class AutomationSetupComponent implements OnInit {
  currentStep = 1;
  isLoading = false;
  isVerifying = false;
  showPassword = false;
  qrPreview: string | null = null;
  qrFile: File | null = null;
  totpExtracted = false;
  totpError: string | null = null;
  userName = '';

  form = {
    ecohub_username: '',
    ecohub_password: '',
    ecohub_totp_secret: '',
    otp_code: '',
    commission_number: '',
  };

  constructor(
    private readonly authService: AuthService,
    private readonly automationService: AutomationService,
    private readonly navigatorService: NavigatorService,
    private readonly toasterService: ToasterService,
    private readonly storageService: StorageService
  ) {}

  ngOnInit(): void {
    const contact = this.authService.userData?.contact;
    this.userName = contact
      ? `${contact.name2 ?? ''} ${contact.name1 ?? ''}`.trim()
      : '';
  }

  canProceed(): boolean {
    if (this.currentStep === 1) {
      return !!this.form.ecohub_username && !!this.form.ecohub_password && !!this.form.commission_number;
    }
    if (this.currentStep === 2) {
      return !!this.qrFile;
    }
    if (this.currentStep === 3) {
      return true;
    }
    return false;
  }

  async nextStep(): Promise<void> {
    if (this.currentStep === 2) {
      await this.extractTotp();
      return;
    }
    this.currentStep++;
  }

  previousStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  private resetToStep1(): void {
    this.currentStep = 1;
    this.qrPreview = null;
    this.qrFile = null;
    this.totpExtracted = false;
    this.totpError = null;
    this.form.ecohub_totp_secret = '';
    this.form.otp_code = '';
  }

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
    this.qrFile = file;
    this.totpExtracted = false;
    this.totpError = null;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.qrPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private async extractTotp(): Promise<void> {
    if (!this.qrFile) {
      this.totpError = 'Incolla prima il QR Code.';
      return;
    }
    this.isLoading = true;
    this.totpError = null;
    try {
      const result = await firstValueFrom(
        this.automationService.extractTotp({
          qr_image: this.qrFile,
        })
      );
      this.form.ecohub_totp_secret = result.secret;
      this.totpExtracted = true;
      this.currentStep = 3;
    } catch {
      this.totpError =
        "Impossibile estrarre il TOTP. Verifica che l'immagine sia corretta.";
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    const contact = this.authService.userData?.contact;
    const consultantId = String(contact?.id ?? '');
    this.isLoading = true;
    try {
      // Step 1: Registra il consulente (se non già registrato)
      if (!this.automationService.hasConsultantApiKey()) {
        try {
          await firstValueFrom(
            this.automationService.registerConsultant({
              onezone_id: consultantId,
              name: contact?.name2 ?? '',
              surname: contact?.name1 ?? '',
              ecohub_username: this.form.ecohub_username,
              ecohub_password: this.form.ecohub_password,
              ecohub_totp_secret: this.form.ecohub_totp_secret,
              commission_number: this.form.commission_number || undefined,
            })
          );
        } catch (err: any) {
          // 409 = consulente già registrato, proseguiamo con l'aggiornamento credenziali
          if (err?.status !== 409) {
            throw err;
          }
        }
      }

      // Step 2: Aggiorna le credenziali Consultant
      const result = await firstValueFrom(
        this.automationService.updateConsultant({
          consultant_id: consultantId,
          ecohub_username: this.form.ecohub_username,
          ecohub_password: this.form.ecohub_password,
          ecohub_totp_secret: this.form.ecohub_totp_secret,
        })
      );
      if (result.status !== 'updated') {
        this.toasterService.warn(
          'Si è verificato un errore. Riprova più tardi.'
        );
        return;
      }

      // Credenziali salvate, ora verifica login su EcoHub
      this.isVerifying = true;
      try {
        const loginResult = await firstValueFrom(
          this.automationService.checkLogin(consultantId).pipe(
            timeout(90000)
          )
        );
        if (loginResult.login_check) {
          try {
            const consultant = await firstValueFrom(
              this.automationService.getConsultant(consultantId)
            );
            this.storageService.setItem('consultantData', JSON.stringify(consultant));
          } catch { /* cache non bloccante */ }
          this.toasterService.success('Setup completato con successo!');
          this.navigatorService.navigateTo('automation-form');
        } else {
          this.toasterService.warn(
            'Login su EcoHub FALLITO. Ripetere la procedura. Se il problema persiste, contattare il webmaster.'
          );
          this.resetToStep1();
        }
      } catch {
        this.toasterService.warn(
          'Login su EcoHub FALLITO. Ripetere la procedura. Se il problema persiste, contattare il webmaster.'
        );
        this.resetToStep1();
      } finally {
        this.isVerifying = false;
      }
    } catch {
      this.toasterService.warn(
        'Si è verificato un errore. Riprova più tardi.'
      );
    } finally {
      this.isLoading = false;
    }
  }
}
