import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {
	NgbButtonsModule,
	NgbDatepickerModule,
	NgbTypeaheadModule,
} from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		NgbModule,
		NgbButtonsModule,
		NgbDatepickerModule,
		NgbTypeaheadModule,
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
