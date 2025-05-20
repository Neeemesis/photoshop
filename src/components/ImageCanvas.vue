<template>
  <div class="canvas-wrapper">
    <div
      class="canvas-container"
      :style="{
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'top left',
      }"
    >
      <canvas ref="canvasRef" class="canvas" />
    </div>
  </div>
</template>

<script>
export default {
  name: "ImageCanvas",
  props: {
    zoom: {
      type: Number,
      default: 100,
    },
  },
  methods: {
    getCanvas() {
      return this.$refs.canvasRef;
    },
  },
};
</script>

<style scoped>
.canvas-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 50px;
  overflow: auto;
  background: #f0f0f0;
}

.canvas-container {
  display: inline-block;
}

.canvas {
  display: block;
  image-rendering: pixelated;
}
</style>
