<template>
  <div class="layout" @wheel.prevent="handleWheel" tabindex="0" @keydown="handleHotkeys">
    <div class="toolbar">
      <button class="tool-button" :class="{ active: activeTool === 'hand' }" @click="setTool('hand')"
        title="Рука (перемещение изображения) [H]">
        ✋ Рука
      </button>
      <button class="tool-button" :class="{ active: activeTool === 'eyedropper' }" @click="setTool('eyedropper')"
        title="Пипетка (выбор цвета) [E]">
        🎯 Пипетка
      </button>
      <button class="tool-button" v-if="!showEditor" @click="showEditor = true"
        title="Открыть боковую панель с инструментами">
        🧰 Открыть редактор
      </button>
    </div>

    <ImageCanvas ref="canvasBlock" :zoom="zoom" :activeTool="activeTool" @color-picked="handleColorPick" />


    <EditorSidebar ref="sidebar" :visible="showEditor" :getCanvas="getCanvas" :openScaleDialog="openScale"
      @close="showEditor = false" :primaryColor="primaryColor" :secondaryColor="secondaryColor" />

    <ScaleDialog ref="scaleDialog" :getCanvas="getCanvas" :originalSize="originalSize"
      @apply-scale="handleScaleApply" />

    <div class="zoom-control">
      <input type="range" min="12" max="500" step="1" v-model="zoom" class="zoom-slider" />
      <input type="number" min="12" max="500" v-model.number="zoom" class="zoom-input" />
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
      showEditor: true,
      originalSize: { width: 1, height: 1 },
      zoom: 100,
      activeTool: 'hand',
      primaryColor: null,
      secondaryColor: null,
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
    setTool(tool) {
      this.activeTool = tool;
    },
    handleHotkeys(event) {
      if (event.key === 'e' || event.key === 'E') {
        this.setTool('eyedropper');
      } else if (event.key === 'h' || event.key === 'H') {
        this.setTool('hand');
      }
    },
    handleColorPick({ color, x, y, isAlt }) {
      if (isAlt) {
        this.secondaryColor = { color, x, y };
      } else {
        this.primaryColor = { color, x, y };
      }
    }
  },
  mounted() {
    this.$el.focus();
  }
};
</script>

<style scoped>
.layout {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.toolbar {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  display: flex;
  gap: 8px;
}

.tool-button {
  padding: 8px 12px;
  background: #333;
  color: white;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
}

.tool-button.active {
  background: #007bff;
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
