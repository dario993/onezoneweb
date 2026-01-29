import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { NavigatorService } from "../services/navigator.service";

export const isAuthenticatedRoute = () => {
  const authService = inject(AuthService);
  const navigatorService = inject(NavigatorService);

  if (authService.isLogged()) {
    return true;
  }

  navigatorService.navigateTo("login");
  return false;
};

export const isNonAuthenticatedRoute = () => {
  const authService = inject(AuthService);
  const navigatorService = inject(NavigatorService);

  if (!authService.isLogged()) {
    return true;
  }

  navigatorService.navigateTo("home");
  return false;
};
