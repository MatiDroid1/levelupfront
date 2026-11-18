import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';

import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import {
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';

import {
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalModule,
  MsalService,
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  ProtectedResourceScopes,
} from '@azure/msal-angular';

import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

const TENANT_ID = 'bb5324af-c266-41ed-b36c-a971641c7af2';

const FRONTEND_CLIENT_ID = '4e1b80a0-e37c-466a-8492-1e6c6bb1d316';

const BACKEND_SCOPE =
  'api://260c8d4a-9eae-4da8-9e2b-76c587b25b85/access_as_user';

const REDIRECT_URI = window.location.origin;

// Se reutiliza esta instancia desde main.ts y desde los providers.
export const msalInstance: IPublicClientApplication =
  new PublicClientApplication({
    auth: {
      clientId: FRONTEND_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      redirectUri: REDIRECT_URI,
      postLogoutRedirectUri: REDIRECT_URI,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level: LogLevel, message: string) => {
          if (level === LogLevel.Error) {
            console.error(message);
          }
        },
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });

function msalInstanceFactory(): IPublicClientApplication {
  return msalInstance;
}

function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['User.Read', BACKEND_SCOPE],
    },
  };
}

function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap =
    new Map<string, Array<string | ProtectedResourceScopes> | null>();

  // Catálogo público; crear y eliminar productos requiere token.
  const productosScopes: ProtectedResourceScopes[] = [
    {
      httpMethod: 'GET',
      scopes: null,
    },
    {
      httpMethod: 'POST',
      scopes: [BACKEND_SCOPE],
    },
    {
      httpMethod: 'DELETE',
      scopes: [BACKEND_SCOPE],
    },
  ];

  protectedResourceMap.set(
    environment.apiProductos,
    productosScopes,
  );

  protectedResourceMap.set(
    `${environment.apiProductos}/*`,
    productosScopes,
  );

  // Pedidos: solicitar y adjuntar el token del backend.
  protectedResourceMap.set(
    environment.apiPedidos,
    [BACKEND_SCOPE],
  );

  protectedResourceMap.set(
    `${environment.apiPedidos}/*`,
    [BACKEND_SCOPE],
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideZoneChangeDetection({
      eventCoalescing: true,
    }),

    provideRouter(routes, withComponentInputBinding()),

    provideHttpClient(withInterceptorsFromDi()),

    importProvidersFrom(MsalModule),

    {
      provide: MSAL_INSTANCE,
      useFactory: msalInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: msalGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: msalInterceptorConfigFactory,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },

    MsalService,
    MsalGuard,
    MsalBroadcastService,
  ],
};