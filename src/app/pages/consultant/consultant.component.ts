import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { IContact } from '../../interfaces/contact.interface';

@Component({
  selector: 'page-consultant',
  standalone: true,
  templateUrl: './consultant.component.html',
  styleUrls: ['./consultant.component.scss'],
  imports: [CommonModule, I18nPipe],
})
export class ConsultantComponent implements OnInit {
  public policyid: string = '';
  public consultant: IContact = {
    firstname: '',
    lastname: '',
    mail: '',
    phone: '',
    mobile: '',
    img: '',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.loadContact(params['policyid']);
    });
  }
  public loadContact(policyid: number): void {
    this.policyid = String(policyid);
    try {
      this.consultant = {
        firstname: this.auth.userData.pointOfContact.firstName,
        lastname: this.auth.userData.pointOfContact.lastName,
        mail: this.auth.userData.pointOfContact.email,
        phone: this.auth.userData.pointOfContact.phone,
        mobile: this.auth.userData.pointOfContact.phoneMobile,
        img: this.auth.userData.pointOfContact.avatar,
      };
    } catch (error) {
      console.log(error);
    }
  }

  public mail(): void {
    window.open(`mailto:${this.consultant.mail}`, '_self');
  }

  public phone(): void {
    window.open(`tel:${this.consultant.phone}`, '_self');
  }

  public mobile(): void {
    window.open(`tel:${this.consultant.mobile}`, '_self');
  }
}
