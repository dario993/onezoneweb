import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isset } from '../../helper';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import { NavigatorService } from '../../services/navigator.service';
import { AuthService } from '../../services/auth.service';
import { BrokerstarService } from '../../services/brokerstar.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { ToasterService } from '../../services/toaster.service';

@Component({
  selector: 'page-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [CommonModule, FormsModule, I18nPipe],
  standalone: true,
})
export class ProfileComponent {
  public showPersonal: boolean = false;
  public showAddress: boolean = false;
  public showAccess: boolean = false;
  public showDocuments: boolean = false;

  public editAddress: boolean = false;
  public editAccess: boolean = false;

  public activeContact: any = {};
  public contacts: any[] = [];

  public files: any[] = [];

  constructor(
    private readonly auth: AuthService,
    private readonly navigator: NavigatorService,
    private readonly changeDetection: ChangeDetectorRef,
    private readonly brokerstarService: BrokerstarService,
    private readonly loaderService: LoaderService,
    public readonly i18n: I18nService,
    private readonly toasterService: ToasterService
  ) {
    this.loadContacts();
  }

  private loadContacts(): void {
    this.loaderService.show();
    this.brokerstarService
      .contactContactList({
        'filters[show_contacts]': 1,
      })
      .subscribe((response: any): void => {
        this.loaderService.hide();
        if (response.data) {
          this.contacts = response.data.map((contact: any) => {
            const contactObject: any = {
              ...contact,
              id: contact.id,
            };

            if (contact.avatar instanceof Blob) {
              const reader = new FileReader();
              reader.readAsDataURL(contact.avatar);
              reader.onloadend = () => {
                contactObject.img = <any>reader.result;
              };
            }

            return contactObject;
          });

          // sort auth user to the top
          this.contacts.sort((a: any, b: any): number => {
            if (a.id === this.auth.userData.contact.id) {
              return -1;
            }
            if (b.id === this.auth.userData.contact.id) {
              return 1;
            }
            return 0;
          });

          this.changeDetection.detectChanges();

          this.setActive(this.auth.userData.contact.id as number);
        }
      });
  }

  public setActive(contactid: any): void {
    this.files = [];
    this.activeContact = this.contacts.find(
      (contact: any) => contact.id === contactid
    );
  }

  public addProfile(): void {
    this.navigator.navigateTo(`link/${this.activeContact.id}`);
  }

  public toggleDocuments(): void {
    this.showDocuments = !this.showDocuments;
    if (this.showDocuments && this.files.length === 0) {
      this.loadFiles(this.activeContact.id);
    }
  }

  public updateAddress(): void {
    this.loaderService.show();

    const payload: Record<string, unknown> = {};
    if (isset(this.activeContact.address)) {
      payload['address'] = this.activeContact.address;
    }
    if (isset(this.activeContact.postcode)) {
      payload['postCode'] = this.activeContact.postcode;
    }
    if (isset(this.activeContact.city)) {
      payload['city'] = this.activeContact.city;
    }

    this.brokerstarService
      .changeContact(this.activeContact.id, payload)
      .subscribe({
        next: (_result: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('profile', 'success')
          );
        },
        error: (error: any) => {
          this.toasterService.alert(
            this.i18n.getTranslation('profile', 'error')
          );
          console.log(error);
        },
        complete: () => {
          this.loaderService.hide();
        },
      });
  }

  public updatePassword(): void {
    this.loaderService.show();

    // update profile
    const profilePayload: Record<string, unknown> = {};
    if (isset(this.activeContact.mail)) {
      profilePayload['mail'] = this.activeContact.mail;
    }
    if (isset(this.activeContact.mobile)) {
      profilePayload['mobile'] = this.activeContact.mobile;
    }

    this.brokerstarService
      .changeContact(this.activeContact.id, profilePayload)
      .subscribe({
        next: (_result: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('profile', 'success')
          );
          this.activeContact.currentPassword = '';
          this.activeContact.password = '';
        },
        error: (error: any) => {
          this.toasterService.alert(
            this.i18n.getTranslation('profile', 'error')
          );
          console.log(error);
        },
        complete: () => {
          this.loaderService.hide();
        },
      });

    // update me
    const mePayload: Record<string, unknown> = {};
    if (isset(this.activeContact.mail, true)) {
      mePayload['login'] = this.activeContact.mail;
      mePayload['email'] = this.activeContact.mail;
    }

    if (Object.keys(mePayload).length !== 0) {
      this.brokerstarService.userMeUpdate(mePayload).subscribe({
        next: async (_result: any) => {
          this.toasterService.success(
            this.i18n.getTranslation('profile', 'success')
          );
          this.loaderService.hide();
          await this.auth.logout();
          await this.navigator.navigateTo('login');
        },
        error: (error: any) => {
          this.toasterService.alert(
            this.i18n.getTranslation('profile', 'error')
          );
          console.log(error);
        },
        complete: () => {
          this.loaderService.hide();
        },
      });
    }

    // update credentials
    const credentialPayload: Record<string, unknown> = {};
    if (isset(this.activeContact.currentPassword, true)) {
      credentialPayload['currentPassword'] = this.activeContact.currentPassword;
    }
    if (isset(this.activeContact.password, true)) {
      credentialPayload['password'] = this.activeContact.password;
    }
    if (Object.keys(credentialPayload).length !== 0) {
      this.brokerstarService
        .changeContactPassword(credentialPayload)
        .subscribe({
          next: async (_result: any) => {
            this.toasterService.success(
              this.i18n.getTranslation('profile', 'success')
            );
            await this.auth.logout();
            await this.navigator.navigateTo('login');
          },
          error: (error: any) => {
            this.toasterService.alert(
              this.i18n.getTranslation('profile', 'error')
            );
            console.log(error);
          },
          complete: () => {
            this.loaderService.hide();
          },
        });
    }
  }

  public async uploadFile(file: any): Promise<void> {
    // Create a file input element for browser file selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const selectedFile = target.files?.[0];

      if (selectedFile) {
        try {
          this.loaderService.show();

          await this.brokerstarService.uploadProfileFile(
            {
              currentUploadEntryid: file.id,
              profileid: this.activeContact.id,
              currentLanguage: this.i18n.currentLanguage,
            },
            selectedFile
          );

          // reload files
          this.loadFiles(this.activeContact.id);
        } catch (error) {
          console.log(error);
        } finally {
          this.loaderService.hide();
        }
      }
    };

    // Trigger the file picker
    input.click();
  }

  public openFile(file: any): void {
    this.navigator.navigateTo(`file/${file.id}`);
  }

  private loadFiles(contactid: number): void {
    this.loaderService.show();
    this.brokerstarService
      .contactFiles(String(contactid))
      .subscribe((response: any): void => {
        this.loaderService.hide();
        this.files = response.data;
      });
    this.changeDetection.detectChanges();
  }
}
