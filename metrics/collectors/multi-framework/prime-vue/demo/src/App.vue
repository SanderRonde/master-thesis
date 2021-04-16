<template>
	<span>
		<span v-if="visibleComponents.Button.length">
			<Button v-for="item in visibleComponents.Button" :key="item"
				>Content</Button
			>
		</span>
		<span v-if="visibleComponents.Switch.length">
			<Checkbox
				v-for="item in visibleComponents.Switch"
				:key="item"
				value="true"
			/>
		</span>
		<span v-if="visibleComponents.Input.length">
			<Input v-for="item in visibleComponents.Input" :key="item" />
		</span>
	</span>
</template>

<script>
export default {
	name: 'App',
	data: () => ({
		visibleComponents: {
			Button: [],
			Switch: [],
			Input: [],
		},
	}),
	created() {
		window.availableComponents = ['Button', 'Input', 'Switch'];
		window.setVisibleComponent = (componentName, numberOfComponents) => {
			this.visibleComponents[componentName] = new Array(numberOfComponents).fill('');
		};
	},
};
</script>

<style>
#app {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	color: #2c3e50;
	margin-top: 60px;
}
</style>
