export const notFoundComponentTsTemplate = () => `import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { timer } from 'rxjs';
import { Crashlytics } from '../crashlytics.service';

@Component({
  selector: 'page-not-found',
  templateUrl: './404.component.html',
  styleUrls: ['./404.component.scss'],
})
export class PageNotFoundComponent implements OnInit, OnDestroy {
  satDiv: any;
  private _timer = timer(0, 4000);
  private _subscription: Subscription;

  constructor(private _elementRef: ElementRef) {}

  datePickerType = 'DATE_PICKER';
  selectedDateRange = {
    startDate: new Date(),
  };
  theme = {
    primary: {
      default: 'purple',
    },
  };
  _true = true;
  _false = false;

  ngOnInit() {
    this.satDiv = this._elementRef.nativeElement.querySelector(
      '.icon-satellite'
    );

    this._subscription = this._timer.subscribe(() => this.setPositionSat());
  }

  setPositionSat() {
    const satTop = Math.round(Math.random() * 50);
    const satLeft = Math.round(Math.random() * 50);
    const satAngle = Math.round(Math.random() * 360);

    this.satDiv.setAttribute(
      'style',
      'transform: rotate(' +
        satAngle +
        'deg) translate3d(' +
        satTop +
        'px,' +
        satLeft +
        'px,0)'
    );
  }

  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
    }
  }
}`;
