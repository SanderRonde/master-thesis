<template>
	<span>
		<ElButton v-if="visibleComponents.Button">Content</ElButton>
		<ElSwitch v-if="visibleComponents.Switch" />
		<ElInput v-if="visibleComponents.Input" />
	</span>
</template>

<script>
import { ElButton, ElSwitch, ElInput } from 'element-plus';

export default {
	name: 'App',
	components: {
		ElButton,
		ElSwitch,
		ElInput,
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
