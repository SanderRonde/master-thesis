<template>
	<span>
		<span v-if="visibleComponents.Button.length">
			<ElButton v-for="item in visibleComponents.Button" :key="item"
				>Content</ElButton
			>
		</span>
		<span v-if="visibleComponents.Switch.length">
			<ElSwitch
				v-for="item in visibleComponents.Switch"
				:key="item"
				value="true"
			/>
		</span>
		<span v-if="visibleComponents.Input.length">
			<ElInput v-for="item in visibleComponents.Input" :key="item" />
		</span>
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
