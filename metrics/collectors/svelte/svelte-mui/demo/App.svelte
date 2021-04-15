<script>
	import { Button, Checkbox, Textfield } from 'svelte-mui';

	window.setVisibleComponent = (componentName, numberOfComponents, isVisible) => {
		visible[componentName] = new Array(numberOfComponents).fill('');
	};
	window.availableComponents = ['Button', 'Input', 'Switch'];

	let visible = {
		Button: [],
		Switch: [],
		Input: [],
	};
</script>

{#if visible.Button.length}
	{#each visible.Button as btn, i }
		<Button>Content</Button>
	{/each}
{/if}
{#if visible.Switch.length}
	{#each visible.Switch as btn, i }
		<Checkbox />
	{/each}
{/if}
{#if visible.Input.length}
	{#each visible.Input as btn, i }
		<Textfield />
	{/each}
{/if}
