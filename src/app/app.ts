import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';

// NOTA IMPORTANTE:
// MsalModule (via MSAL_INSTANCE en app.config.ts) ya crea e inicializa
// la instancia de PublicClientApplication. NO se debe volver a llamar
// msalService.instance.initialize() aqui: hacerlo dos veces generaba una
// carrera interna en MSAL que causaba state_mismatch, timed_out e
// interaction_in_progress en cadena.
//
// Este componente solo llama a handleRedirectObservable() una vez, sin
// envolver en initialize().then(...), que es el patron soportado para
// apps standalone que no usan MsalRedirectComponent (el cual en esta
// version de @azure/msal-angular no es standalone-friendly).
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly msalService = inject(MsalService);

  ngOnInit(): void {
    this.msalService.handleRedirectObservable().subscribe({
      next: () => {
        const cuentas = this.msalService.instance.getAllAccounts();
        if (cuentas.length > 0) {
          this.msalService.instance.setActiveAccount(cuentas[0]);
        }
      },
      error: (error) => {
        console.error('Error procesando el redirect de MSAL:', error);
      },
    });
  }
}