import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class ToasterService {
  constructor(private readonly toastr: ToastrService) {}

  public primary(text: string): void {
    this.toastr.info(text, '', {
      toastClass: 'ngx-toastr toast-primary',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
    });
  }

  public accent(text: string): void {
    this.toastr.info(text, '', {
      toastClass: 'ngx-toastr toast-accent',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
    });
  }

  public alert(text: string): void {
    this.toastr.warning(text, '', {
      toastClass: 'ngx-toastr toast-alert',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
    });
  }

  public warn(text: string): void {
    this.toastr.error(text, '', {
      toastClass: 'ngx-toastr toast-warn',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
    });
  }

  public success(text: string): void {
    this.toastr.success(text, '', {
      toastClass: 'ngx-toastr toast-success',
      titleClass: 'toast-title',
      messageClass: 'toast-message',
    });
  }
}
