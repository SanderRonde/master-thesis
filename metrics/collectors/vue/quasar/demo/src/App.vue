<template>
	<span>
		<span v-if="visibleComponents.Button.length">
			<q-btn v-for="item in visibleComponents.Button" :key="item"
				>Content</q-btn
			>
		</span>
		<span v-if="visibleComponents.Switch.length">
			<q-checkbox
				v-for="item in visibleComponents.Button"
				:key="item"
				value="true"
			/>
		</span>
		<span v-if="visibleComponents.Input.length">
			<q-input v-for="item in visibleComponents.Button" :key="item" />
		</span>
	</span>
</template>

<script>
import { QBtn, QCheckbox, QInput } from 'quasar';

export default {
	name: 'App',
	components: {
		QBtn,
		QCheckbox,
		QInput,
	},
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
