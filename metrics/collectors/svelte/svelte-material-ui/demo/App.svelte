<script>
	import Button from '@smui/button';
	import Textfield from '@smui/textfield';
	import Switch from '@smui/switch';

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
