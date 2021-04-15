<template>
	<span>
		<span v-if="visibleComponents.Button.length">
			<v-btn v-for="item in visibleComponents.Button" :key="item"
				>Content</v-btn
			>
		</span>
		<span v-if="visibleComponents.Switch.length">
			<v-checkbox
				v-for="item in visibleComponents.Button"
				:key="item"
				value="true"
			/>
		</span>
		<span v-if="visibleComponents.Input.length">
			<v-text-field
				v-for="item in visibleComponents.Button"
				:key="item"
			/>
		</span>
	</span>
</template>

<script>
export default {
	name: 'App',
	components: {},
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
			this.visibleComponents[componentName] = new Array(
				numberOfComponents
			).fill('');
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
