<template>
  <div id="app">
    <ImageLoading />
  </div>
</template>

<script>
import ImageLoading from './components/ImageLoading.vue';

export default {
  name: 'App',
  components: {
    ImageLoading
  }
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
