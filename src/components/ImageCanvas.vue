<template>
  <div class="canvas-wrapper" @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp"
    @mouseleave="onMouseUp" @click="onClick">
    <div class="canvas-container" :style="{
      transform: `scale(${zoom / 100})`,
      transformOrigin: 'top left',
      left: offset.x + 'px',
      top: offset.y + 'px',
      position: 'relative',
    }">
      <canvas ref="canvasRef" class="canvas" />
    </div>
  </div>
</template>

<script>
import { rgbToOklch } from '@/utils/colorUtils';

export default {
  name: "ImageCanvas",
  props: {
    zoom: { type: Number, default: 100 },
    activeTool: { type: String, required: true },
  },
  data() {
    return {
      dragging: false,
      dragStart: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
    };
  },
  mounted() {
    const canvas = this.$refs.canvasRef;
    canvas.width = 1000;
    canvas.height = 800;
  },
  methods: {
    getCanvas() {
      return this.$refs.canvasRef;
    },
    onMouseDown(e) {
      if (this.activeTool === 'hand') {
        this.dragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
      }
    },
    onMouseMove(e) {
      if (this.activeTool === 'hand' && this.dragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        this.offset.x += dx;
        this.offset.y += dy;
        this.dragStart = { x: e.clientX, y: e.clientY };
      }
    },
    onMouseUp() {
      this.dragging = false;
    },
    onClick(e) {
      if (this.activeTool !== 'eyedropper') return;

      const canvas = this.$refs.canvasRef;
      const wrapper = e.currentTarget; 
      const rect = canvas.getBoundingClientRect();
      const scale = this.zoom / 100;

      const scrollLeft = wrapper.scrollLeft;
      const scrollTop = wrapper.scrollTop;

      const x = (e.clientX - rect.left + scrollLeft) / scale;
      const y = (e.clientY - rect.top + scrollTop) / scale;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const rgb = [pixel[0], pixel[1], pixel[2]];

      const oklch = rgbToOklch(rgb);

      const isAlt = e.altKey || e.ctrlKey || e.shiftKey;

      this.$emit("color-picked", {
        color: { rgb, oklch },
        x: Math.floor(x),
        y: Math.floor(y),
        isAlt
      });
    }

  }
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
  overflow: auto;
}

.canvas-container {
  display: inline-block;
  transition: left 0.1s, top 0.1s;
}

.canvas {
  display: block;
  image-rendering: pixelated;
}
</style>
