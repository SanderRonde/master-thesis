<script>
	import 'smelte/src/tailwind.css';
	import Button from 'smelte/src/components/Button';
	import Textfield from 'smelte/src/components/TextField';
	import Switch from 'smelte/src/components/Switch';
	import DatePicker from 'smelte/src/components/DatePicker';

	window.setVisibleComponent = (componentName, isVisible) => {
		visible[componentName] = isVisible;
	};
	window.avilableComponents = ['Button', 'Input', 'Switch', 'DatePicker'];

	let visible = {
		Button: false,
		Switch: false,
		Input: false,
		DatePicker: false,
	};
</script>

{#if visible.Button}
	<Button>Content</Button>
{/if}
{#if visible.Switch}
	<Switch />
{/if}
{#if visible.Input}
	<Textfield label="Label" />
{/if}
{#if visible.DatePicker}
	<DatePicker />
{/if}
