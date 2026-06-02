import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly currentVersion = '2.0.1'; // Update this as needed

  public setItem(field: string, value: string): void {
    try {
      localStorage.setItem(field, value);
    } catch (error) {
      console.error('Error setting localStorage item:', error);
    }
  }

  public getItem(field: string): string {
    try {
      return localStorage.getItem(field) || '';
    } catch (error) {
      console.error('Error getting localStorage item:', error);
      return '';
    }
  }

  public removeItem(field: string): void {
    try {
      localStorage.removeItem(field);
    } catch (error) {
      console.error('Error removing localStorage item:', error);
    }
  }

  public clear(): void {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  public clearOldVersions(): void {
    const storedVersion = this.getItem('version');
    if (storedVersion !== this.currentVersion) {
      this.clear();
    }
    this.setItem('version', this.currentVersion);
  }
}
