<script>
	import 'smelte/src/tailwind.css';
	import Button from 'smelte/src/components/Button';
	import Textfield from 'smelte/src/components/TextField';
	import Switch from 'smelte/src/components/Switch';

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
	<Switch />
{/if}
{#if visible.Input}
	<Textfield label="Label" />
{/if}
