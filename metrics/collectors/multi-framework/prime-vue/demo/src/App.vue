<template>
	<span>
		<Button v-if="visibleComponents.Button">Content</Button>
		<Checkbox value="true" v-if="visibleComponents.Switch" />
		<Input v-if="visibleComponents.Input" />
	</span>
</template>

<script>
export default {
	name: 'App',
	data: () => ({
		visibleComponents: {
			Button: false,
			Switch: false,
			Input: false,
		},
	}),
	created() {
		window.availableComponents = ['Button', 'Input', 'Switch'];
		window.setVisibleComponent = (componentName) => {
			this.visibleComponents[componentName] = true;
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
