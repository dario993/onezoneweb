import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isset } from '../../helper';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'app-recover',
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
  standalone: true,
})
export class RecoverComponent {
  public recoverData: Record<string, unknown> = {};

  public securePass: boolean = true;

  constructor(
    private readonly loaderService: LoaderService,
    private readonly brokerstarService: BrokerstarService,
    private readonly toasterService: ToasterService,
    private readonly i18n: I18nService
  ) {}

  public togglePasswordVisibility(): void {
    this.securePass = !this.securePass;
  }

  public submit(): void {
    this.loaderService.show();
    if (isset(this.recoverData['code'], true)) {
      this.confirmResetPassword();
    } else {
      this.resetPassword();
    }
    this.loaderService.hide();
  }

  private confirmResetPassword(): void {
    this.loaderService.show();
    this.brokerstarService
      .confirmResetPassword({
        login: this.recoverData['email'],
        code: String(this.recoverData['code']),
        password: String(this.recoverData['password']),
      })
      .subscribe({
        next: async (_data: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('recover', 'passwordchanged')
          );
        },
        error: (error: any) => {
          this.toasterService.warn(error.error.error);
        },
        complete: () => this.loaderService.hide(),
      });
  }

  private resetPassword(): void {
    this.loaderService.show();
    this.brokerstarService
      .resetPassword({
        login: this.recoverData['email'],
        onlyCode: true,
      })
      .subscribe({
        next: async (_data: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('recover', 'youhaveanemail')
          );
        },
        error: (error: any) => {
          this.toasterService.warn(error.error.error);
        },
        complete: () => this.loaderService.hide(),
      });
  }
}
