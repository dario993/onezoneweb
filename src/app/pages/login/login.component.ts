import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isset } from '../../helper';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';

@Component({
  selector: 'page-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
  standalone: true,
})
export class LoginComponent {
  @ViewChild('passwordInput', { static: false })
  passwordInput!: ElementRef<HTMLInputElement>;

  public username: string = '';
  public password: string = '';

  securePass: boolean = true;
  error: boolean = false;
  errorMessage: string = '';

  constructor(
    private readonly i18n: I18nService,
    private readonly auth: AuthService,
    private readonly brokerstarService: BrokerstarService,
    public readonly navigator: NavigatorService,
    private readonly loaderService: LoaderService
  ) {}

  public async login(): Promise<void> {
    this.loaderService.show();
    this.brokerstarService.login(this.username, this.password).subscribe({
      next: async (data: any): Promise<void> => {
        if (isset(data.token)) {
          this.brokerstarService.token = data.token;
          if (await this.auth.startSession(data)) {
            await this.navigator.navigateTo('home');
          }
        }
      },
      error: (error: any): void => {
        console.log(error);
        this.toggleError('LOGIN_STATUS_FAILED');
        this.loaderService.hide();
      },
      complete: (): void => {
        this.loaderService.hide();
      },
    });
  }

  public focusPassword(): void {
    if (this.passwordInput?.nativeElement) {
      this.passwordInput.nativeElement.focus();
    }
  }

  public togglePasswordVisibility(): void {
    this.securePass = !this.securePass;
  }

  private toggleError(messageID: string): void {
    this.error = true;
    this.errorMessage = this.i18n.getTranslation(...['login', messageID]);
  }

  public hideError(): void {
    this.error = false;
  }
}
