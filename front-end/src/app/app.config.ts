import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { DateAdapter, MAT_DATE_FORMATS, provideNativeDateAdapter } from '@angular/material/core';
import { MY_DATE_FORMATS } from './helpers/custom-date-adapter';
import { CustomDateAdapter } from './helpers/custom-date-adapter';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
       { provide: DateAdapter, useClass: CustomDateAdapter },
    
   
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    provideNativeDateAdapter(),
    provideRouter(routes), provideClientHydration(withEventReplay())
  ]
};
