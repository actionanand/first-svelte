import App from './App.svelte';

const app = new App({
	// target: document.body,
  target: document.querySelector('#app'),
  // target: document.getElementById('app'),
  props: {
    appName: 'first svelte app'
  }
});

export default app;