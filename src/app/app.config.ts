import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import {
  MsalModule,
  MsalService,
  MsalInterceptor,
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuard,
  MsalBroadcastService,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import {
  PublicClientApplication,
  IPublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  LogLevel,
} from '@azure/msal-browser';

import { routes } from './app.routes';

// ---------------------------------------------------------------------------
// Datos reales del tenant Pedidos360 (Azure AD / Entra ID)
// ---------------------------------------------------------------------------
const TENANT_ID = 'bb5324af-c266-41ed-b36c-a971641c7af2';
const FRONTEND_CLIENT_ID = '4e1b80a0-e37c-466a-8492-1e6c6bb1d316';
const BACKEND_SCOPE = 'api://260c8d4a-9eae-4da8-9e2b-76c587b25b85/access_as_user';
const REDIRECT_URI = 'http://localhost:4200';

// ---------------------------------------------------------------------------
// Instancia UNICA de MSAL.
// ---------------------------------------------------------------------------
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
        loggerCallback: (_level: LogLevel, message: string) => {
          console.log(message);
        },
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Configuración del Guard
// ---------------------------------------------------------------------------
function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['User.Read', BACKEND_SCOPE],
    },
  };
}

// ---------------------------------------------------------------------------
// Configuración del Interceptor
//
// IMPORTANTE: el orden de las entradas en protectedResourceMap importa.
// Las entradas mas especificas con scope null (recurso NO protegido) deben
// ir ANTES que cualquier patron wildcard mas general que las englobe.
// Si no, el wildcard matchea primero y fuerza login/redirect incluso en
// rutas publicas como GET /productos (usado en la home, sin login).
//
// GET /productos es publico en el backend (SecurityConfig.java lo
// permite sin JWT), asi que aqui tambien debe quedar sin scope, para que
// MsalInterceptor jamas dispare acquireTokenRedirect al cargar la home.
// ---------------------------------------------------------------------------
function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string> | null>();

  // Publico: catalogo de productos (home y /catalogo lo llaman sin login).
  protectedResourceMap.set('http://localhost:8080/productos', null);
  protectedResourceMap.set('http://localhost:8080/productos/*', null);

  // Protegido: mspedidos completo (crear/listar/cambiar estado de pedidos).
  protectedResourceMap.set('http://localhost:8081/*', [BACKEND_SCOPE]);

  // Protegido: cualquier otra ruta de msproductos que no sea GET publico
  // (por ejemplo, si mas adelante se agrega un panel admin que haga
  // POST/DELETE sobre /productos).
  protectedResourceMap.set('http://localhost:8080/*', [BACKEND_SCOPE]);

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