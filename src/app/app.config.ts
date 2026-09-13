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
} from '@azure/msal-angular';

import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';

import { routes } from './app.routes';

const TENANT_ID = 'bb5324af-c266-41ed-b36c-a971641c7af2';
const FRONTEND_CLIENT_ID = '4e1b80a0-e37c-466a-8492-1e6c6bb1d316';
const BACKEND_SCOPE =
  'api://260c8d4a-9eae-4da8-9e2b-76c587b25b85/access_as_user';

const REDIRECT_URI = 'http://localhost:4200';

const API_BASE =
  'https://2fdh45ejme.execute-api.us-east-1.amazonaws.com';

function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
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
  const protectedResourceMap = new Map<string, Array<string> | null>();

  // Productos: público.
  protectedResourceMap.set(
    'https://2fdh45ejme.execute-api.us-east-1.amazonaws.com/productos',
    null
  );

  // Pedidos raíz: GET y POST /pedidos.
  protectedResourceMap.set(
    'https://2fdh45ejme.execute-api.us-east-1.amazonaws.com/pedidos',
    [BACKEND_SCOPE]
  );

  // Pedidos por ID: GET/PATCH /pedidos/{id}/...
  protectedResourceMap.set(
    'https://2fdh45ejme.execute-api.us-east-1.amazonaws.com/pedidos/*',
    [BACKEND_SCOPE]
  );

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),

    /*
     * Necesario para que HttpClient ejecute MsalInterceptor registrado
     * a través de HTTP_INTERCEPTORS.
     */
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