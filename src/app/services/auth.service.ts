import { Injectable } from '@angular/core';
import { convertStringToJSON, isset, trim } from '../helper';
import { StorageService } from './storage.service';
import { BrokerstarService } from './brokerstar.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isAuth: boolean = true;
  public isRegister: boolean = false;
  public isConsultant: boolean = false;

  public token: string = '';
  public userData: any = {};

  private tokenValidUntil: Date = new Date();

  constructor(
    private readonly brokerstarService: BrokerstarService,
    private readonly storageService: StorageService
  ) {}

  public isLogged(): boolean {
    // user is logged in if token is set and valid
    return (
      this.isAuth &&
      this.userData.contact &&
      this.token &&
      this.tokenValidUntil > new Date()
    );
  }

  public async startSession(oUserAuthData: any): Promise<boolean> {
    // set token
    this.token = oUserAuthData.token;

    // token is valid for 24hrs
    this.tokenValidUntil = new Date();
    this.tokenValidUntil.setHours(this.tokenValidUntil.getHours() + 24);

    // load userdata
    if (await this.fetchUserData()) {
      this.isAuth = true;
      this.storageService?.setItem('token', this.token);
      this.storageService?.setItem(
        'tokenValidUntil',
        this.tokenValidUntil.toUTCString()
      );
      this.storageService?.setItem('userData', JSON.stringify(this.userData));
      return true;
    }
    return false;
  }

  public loadSession(): void {
    this.userData = {};
    try {
      this.token = this.storageService?.getItem('token') || '';
      this.tokenValidUntil = new Date(
        this.storageService?.getItem('tokenValidUntil') || ''
      );
      this.userData = convertStringToJSON(
        this.storageService?.getItem('userData') || '',
        {}
      );
      this.brokerstarService.token = this.token;
    } catch (oErr) {
      console.error(oErr);
    }
    if (!(this.userData instanceof Object) || !isset(this.userData)) {
      this.endSession();
      return;
    }
    this.isAuth = true;
  }

  public endSession(): void {
    this.storageService?.removeItem('token');
    this.storageService?.removeItem('tokenValidUntil');
    this.storageService?.removeItem('userData');
    this.storageService?.clear();
    this.isAuth = false;
    this.userData = {};
    this.isConsultant = false;
  }

  public async fetchUserData(): Promise<boolean> {
    this.userData = {};
    return new Promise((resolve, _reject) => {
      this.brokerstarService.userMe().subscribe((data: any): void => {
        if (data) {
          this.userData = data;
          return resolve(true);
        }
        return resolve(false);
      });
    });
  }

  public async logout(): Promise<boolean> {
    return new Promise((resolve, _reject) => {
      this.brokerstarService.logout().subscribe((data: any): void => {
        this.endSession();
        return resolve(true);
      });
    });
  }

  public getUserName(type?: number, name1?: string, name2?: string): string {
    // Vorbelegen
    if (!isset(type)) {
      type = this.userData.contact?.type;
    }
    if (!isset(name1)) {
      name1 = this.userData.contact?.name1;
    }
    if (!isset(name2)) {
      name2 = this.userData.contact?.name2;
    }
    if (!isset(name1)) {
      name1 = '';
    }
    if (!isset(name2)) {
      name2 = '';
    }
    if (type === 1) {
      return trim(String(name1) + ' ' + String(name2));
    }
    return trim(String(name2) + ' ' + String(name1));
  }
}
