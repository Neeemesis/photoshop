<template>
  <div class="canvas-wrapper">
    <canvas ref="canvasRef" class="canvas" />
  </div>
</template>

<script>
export default {
  name: "ImageCanvas",
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
  justify-content: center;
  align-items: center;
  padding: 50px;
  overflow: auto;
  background: #f0f0f0;
}

.canvas {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  display: block;
  max-width: 100%;
  max-height: 100%;
  height: auto;
  image-rendering: pixelated; /* чтобы ближайший сосед работал визуально */
}
</style>
