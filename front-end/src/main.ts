import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app.component';
import { App } from './app/app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
// import { TokenInterceptor } from './core/interceptors/token.interceptor';
import { TokenInterceptor } from './app/core/interceptors/token.interceptor';

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ]
}).catch(err => console.error(err));
