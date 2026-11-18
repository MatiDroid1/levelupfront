import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { firstValueFrom } from 'rxjs';

const BACKEND_SCOPE =
  'api://260c8d4a-9eae-4da8-9e2b-76c587b25b85/access_as_user';

export const adminGuard: CanActivateFn = async () => {
  const msal = inject(MsalService);
  const router = inject(Router);

  const account =
    msal.instance.getActiveAccount() ??
    msal.instance.getAllAccounts()[0];

  if (!account) {
    return router.createUrlTree(['/']);
  }

  try {
    const result = await firstValueFrom(
      msal.acquireTokenSilent({
        account,
        scopes: [BACKEND_SCOPE],
      }),
    );

    const encodedPayload = result.accessToken.split('.')[1];

    if (!encodedPayload) {
      return router.createUrlTree(['/']);
    }

    const normalized = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      '=',
    );

    const payload = JSON.parse(atob(padded)) as {
      roles?: string[];
    };

    return payload.roles?.includes('admin')
      ? true
      : router.createUrlTree(['/']);
  } catch (error) {
    console.error(
      'No se pudo comprobar el acceso de administrador.',
      error,
    );

    return router.createUrlTree(['/']);
  }
};