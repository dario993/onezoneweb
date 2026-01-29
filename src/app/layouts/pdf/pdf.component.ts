import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'layout-pdf',
  templateUrl: './pdf.component.html',
  imports: [CommonModule, RouterOutlet],
  standalone: true,
})
export class LayoutPDFComponent {
  constructor(private readonly location: Location) {}

  public goBack(): void {
    this.location.back();
  }
}
