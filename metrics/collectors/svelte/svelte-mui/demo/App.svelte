<script>
	import { Button, Datepicker, Checkbox, Textfield } from 'svelte-mui';

	window.setVisibleComponent = (componentName, isVisible) => {
		visible[componentName] = isVisible;
	};
	window.availableComponents = ['Button', 'Input', 'Switch', 'DatePicker'];

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
	<Checkbox />
{/if}
{#if visible.Input}
	<Textfield />
{/if}
{#if visible.DatePicker}
	<Datepicker />
{/if}
