<template>
	<span>
		<q-btn v-if="visibleComponents.Button">Content</q-btn>
		<q-checkbox value="true" v-if="visibleComponents.Switch" />
		<q-input v-if="visibleComponents.Input" />
	</span>
</template>

<script>
import { QBtn, QCheckbox, QInput } from 'quasar';

export default {
	name: 'App',
	components: {
		QBtn, QCheckbox, QInput
	},
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
