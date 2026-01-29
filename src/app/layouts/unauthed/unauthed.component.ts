import {
  Component,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavigatorService } from '../../services/navigator.service';
import { I18nService } from '../../services/i18n.service';
import { LoaderService } from '../../services/loader.service';
import statics from '../../../assets/statics.json';
import { I18nPipe } from '../../pipes/i18n.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'layout-unauthed',
  templateUrl: './unauthed.component.html',
  styleUrls: ['./unauthed.component.scss'],
  imports: [CommonModule, RouterOutlet, I18nPipe],
  standalone: true,
})
export class LayoutUnauthedComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @ViewChild('loadingImage', { static: false })
  loadingImage!: ElementRef<HTMLImageElement>;

  private rotationAnimation: number | null = null;
  private loadingSubscription!: Subscription;
  private isLoading = false;
  private retryCount = 0;
  private readonly maxRetries = 5;

  constructor(
    public readonly navigator: NavigatorService,
    public readonly loaderService: LoaderService,
    public readonly i18n: I18nService
  ) {}

  ngOnInit(): void {
    // Subscribe to loading state changes
    this.loadingSubscription = this.loaderService.loading$.subscribe(
      (isLoading) => {
        this.isLoading = isLoading;
        if (isLoading) {
          this.retryCount = 0; // Reset retry counter when starting new loading
          this.startRotation();
        } else {
          this.stopRotation();
        }
      }
    );
  }

  ngAfterViewInit(): void {
    // Start rotation if loading is already true when view is initialized
    if (this.isLoading) {
      this.startRotation();
    }
  }

  ngOnDestroy(): void {
    if (this.loadingSubscription) {
      this.loadingSubscription.unsubscribe();
    }
    this.stopRotation();
  }

  private startRotation(): void {
    if (this.loadingImage?.nativeElement) {
      this.retryCount = 0; // Reset retry counter on success
      const image = this.loadingImage.nativeElement;

      // Stop any existing animation first
      this.stopRotation();

      let currentRotation = 0;

      const rotateStep = () => {
        if (this.rotationAnimation !== null) {
          currentRotation += 10;
          if (currentRotation >= 360) {
            currentRotation = 0;
          }

          image.style.transform = `rotate(${currentRotation}deg)`;

          this.rotationAnimation = requestAnimationFrame(() => {
            if (this.rotationAnimation !== null) {
              setTimeout(rotateStep, 50);
            }
          });
        }
      };

      this.rotationAnimation = requestAnimationFrame(rotateStep);
    } else {
      this.retryCount++;
      if (this.retryCount <= this.maxRetries) {
        setTimeout(() => this.startRotation(), 500);
      }
    }
  }

  private stopRotation(): void {
    if (this.rotationAnimation !== null) {
      cancelAnimationFrame(this.rotationAnimation);
      this.rotationAnimation = null;

      // Reset the image rotation
      if (this.loadingImage?.nativeElement) {
        this.loadingImage.nativeElement.style.transform = 'rotate(0deg)';
      }
    }
  }

  public openFooterLink(link: string): void {
    switch (link) {
      case 'support': {
        this.navigator.navigateTo(
          statics.LinkOneZoneSupport[this.i18n.currentLanguage]
        );
        break;
      }
      case 'onezone': {
        this.navigator.navigateTo(
          statics.LinkOneZoneWebsite[this.i18n.currentLanguage]
        );
        break;
      }
      case 'i18n': {
        this.navigator.navigateTo('language_unauthed', true);
      }
    }
  }
}
