<script>
	import { Button, Checkbox, Textfield } from 'svelte-mui';

	window.setVisibleComponent = (componentName, isVisible) => {
		visible[componentName] = isVisible;
	};
	window.availableComponents = ['Button', 'Input', 'Switch'];

	let visible = {
		Button: false,
		Switch: false,
		Input: false,
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
