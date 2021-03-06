import { ChangeDetectorRef, Component } from '@angular/core';

declare const window: any;

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
})
export class AppComponent {
	title = 'demo';

	constructor(private _cd: ChangeDetectorRef) {
		window.availableComponents = [
			'Button',
			'Switch',
			'Input',
		];
		window.setVisibleComponent = (
			componentName: string,
			numberOfComponents: number,
			isVisible: boolean
		) => {
			if (!isVisible) {
				this.visibleComponent = null;
			} else {
				this.visibleComponent = componentName;
			}
			this.componentCount = new Array(numberOfComponents).fill('');
			this._cd.detectChanges();
		};
	}

	public visibleComponent: string | null = null;
	public componentCount: unknown[] = [];
}

