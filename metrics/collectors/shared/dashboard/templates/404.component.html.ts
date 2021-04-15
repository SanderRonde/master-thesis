export const notFoundComponentHTMLTemplate = () => `
<fireworks></fireworks>
<button primary>Button (wrapped)</button>
<button primary>Button (themed)</button>
<button primary delete>Delete Button (wrapped)</button>
<button secondary>Secondary button</button>
<button tertiary>Tertiary button</button>
<button tertiary gray close></button>
<switch [isOn]="_false"></switch>
<switch [isOn]="_true"></switch>
<switch></switch>
<switch-option [iconName]="'pencil'"></switch-option>
<input cow />
<input cow readonly />

<popup-date-range-picker
  [selectedDate]="selectedDateRange"
  [type]="datePickerType"
></popup-date-range-picker>
`