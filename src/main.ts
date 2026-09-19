import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig, msalInstance } from './app/app.config';

msalInstance.initialize().then(() => {
  bootstrapApplication(App, appConfig).catch((err) => console.error(err));
});