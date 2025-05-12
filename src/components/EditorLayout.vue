<template>
  <div class="layout">
    <!-- Кнопка открытия редактора -->
    <button v-if="!showEditor" class="toggle" @click="showEditor = true">
      Открыть редактор
    </button>

    <!-- Холст -->
    <ImageCanvas ref="canvasBlock" />

    <!-- Панель редактирования -->
    <EditorSidebar
      :visible="showEditor"
      :getCanvas="getCanvas"
      :openScaleDialog="openScale"
      @close="showEditor = false"
    />

    <!-- Диалог масштабирования -->
    <ScaleDialog
      ref="scaleDialog"
      :getCanvas="getCanvas"
      :originalSize="originalSize"
    />
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
    };
  },
  methods: {
    getCanvas() {
      return this.$refs.canvasBlock.getCanvas();
    },
    openScale() {
      const canvas = this.getCanvas();
      this.originalSize = {
        width: canvas.width,
        height: canvas.height,
      };
      this.$refs.scaleDialog.openDialog();
    },
  },
};
</script>

<style scoped>
.layout {
  position: relative;
  width: 100%;
  height: 100vh;
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
</style>
