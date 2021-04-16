<script>
	import Button from '@smui/button';
	import Textfield from '@smui/textfield';
	import Switch from '@smui/switch';

	window.setVisibleComponent = (componentName, numberOfComponents, isVisible) => {
		visible[componentName] = new Array(numberOfComponents).fill('');
	};
	window.availableComponents = ['Button', 'Input', 'Switch'];

	let visible = {
		Button: false,
		Switch: false,
		Input: false,
	};
</script>

{#if visible.Button.length}
	{#each visible.Button as btn, i }
		<Button>Content</Button>
	{/each}
{/if}
{#if visible.Switch.length}
	{#each visible.Switch as btn, i }
		<Switch />
	{/each}
{/if}
{#if visible.Input.length}
	{#each visible.Input as btn, i }
		<Textfield label="Label" />
	{/each}
{/if}
