<script>
	import 'smelte/src/tailwind.css';
	import Button from 'smelte/src/components/Button';
	import Textfield from 'smelte/src/components/TextField';
	import Switch from 'smelte/src/components/Switch';

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
		<Switch />
	{/each}
{/if}
{#if visible.Input.length}
	{#each visible.Input as btn, i }
		<Textfield label="Label" />
	{/each}
{/if}
