<template>
  <div class="layout" @wheel.prevent="handleWheel">
    <button v-if="!showEditor" class="toggle" @click="showEditor = true">
      Открыть редактор
    </button>

    <ImageCanvas ref="canvasBlock" :zoom="zoom" />

    <EditorSidebar
      ref="sidebar"
      :visible="showEditor"
      :getCanvas="getCanvas"
      :openScaleDialog="openScale"
      @close="showEditor = false"
    />

    <ScaleDialog
      ref="scaleDialog"
      :getCanvas="getCanvas"
      :originalSize="originalSize"
      @apply-scale="handleScaleApply"
    />

    <!-- Масштаб ползунок и поле ввода -->
    <div class="zoom-control">
      <input
        type="range"
        min="12"
        max="500"
        step="1"
        v-model="zoom"
        class="zoom-slider"
      />
      <input
        type="number"
        min="12"
        max="500"
        v-model.number="zoom"
        class="zoom-input"
      />
      <span class="zoom-label">%</span>
    </div>
  </div>
</template>

<script>
import ImageCanvas from "./ImageCanvas.vue";
import EditorSidebar from "./EditorSidebar.vue";
import ScaleDialog from "./ScaleDialog.vue";

export default {
  name: "EditorLayout",
  components: {
    ImageCanvas,
    EditorSidebar,
    ScaleDialog,
  },
  data() {
    return {
      showEditor: false,
      originalSize: { width: 1, height: 1 },
      zoom: 100,
    };
  },
  methods: {
    getCanvas() {
      return this.$refs.canvasBlock.getCanvas();
    },
    openScale(meta) {
      this.originalSize = {
        width: meta.width,
        height: meta.height,
      };
      this.$refs.scaleDialog.openDialog();
    },
    handleScaleApply(newMeta) {
      this.originalSize = {
        width: newMeta.width,
        height: newMeta.height,
      };
      this.$refs.sidebar.imageMeta = { ...newMeta };
    },
    handleWheel(event) {
      const delta = event.deltaY;
      const step = 10;

      if (delta > 0) {
        this.zoom = Math.max(12, this.zoom - step);
      } else {
        this.zoom = Math.min(500, this.zoom + step);
      }
    },
  },
};
</script>

<style scoped>
.layout {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.toggle {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.zoom-control {
  position: absolute;
  bottom: 20px;
  right: 345px;
  z-index: 1000;
  display: flex;
  align-items: center;
  background: #2a2a2a;
  padding: 8px 12px;
  border-radius: 6px;
  gap: 8px;
}

.zoom-slider {
  width: 120px;
}

.zoom-input {
  width: 60px;
  background: #444;
  color: white;
  border: 1px solid #666;
  padding: 4px 6px;
  border-radius: 4px;
}

.zoom-label {
  color: white;
}
</style>
