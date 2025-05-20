<template>
  <div class="sidebar" v-if="visible">
    <h2>Редактор</h2>

    <input type="file" @change="onFileChange" accept=".gb7,.png,.jpg,.jpeg" />
    <button @click="loadImage" :disabled="!file">Загрузить</button>

    <div v-if="imageMeta" class="info">
      <p><strong>Ширина:</strong> {{ imageMeta.width }} px</p>
      <p><strong>Высота:</strong> {{ imageMeta.height }} px</p>
      <p><strong>Глубина:</strong> {{ depthInfo }}</p>
      <button @click="download">Скачать PNG</button>
    </div>

    <button class="scale" @click="openScaleDialog(imageMeta)" :disabled="!imageMeta">
      Масштабировать
    </button>
    <button class="close" @click="$emit('close')">Закрыть</button>
  </div>
</template>

<script>
import {
  parseGB7,
  renderGB7ToCanvas,
  renderImageToCanvas,
} from "../utils/imageProcessor";

export default {
  name: "EditorSidebar",
  props: {
    visible: Boolean,
    getCanvas: Function,
    openScaleDialog: Function,
  },
  data() {
    return {
      file: null,
      imageMeta: null,
    };
  },
  computed: {
    depthInfo() {
      if (!this.imageMeta) return "—";
      if (this.imageMeta.grayscale7Bit) {
        return `7-бит серого${this.imageMeta.hasAlphaMask ? " + маска" : ""}`;
      }
      return this.imageMeta.alphaChannelDetected ? "32-бит RGBA" : "24-бит RGB";
    },
  },
  methods: {
    onFileChange(e) {
      this.file = e.target.files[0];
      if (this.file) this.loadImage();
    },
    loadImage() {
      const file = this.file;
      const canvas = this.getCanvas();
      if (!file || !canvas) return;

      const ext = file.name.split(".").pop().toLowerCase();

      if (ext === "gb7") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const parsed = parseGB7(e.target.result);
          const meta = renderGB7ToCanvas(canvas, parsed);
          this.imageMeta = { ...meta };
        };
        reader.readAsArrayBuffer(file);
      } else {
        renderImageToCanvas(canvas, file, (meta) => {
          this.imageMeta = { ...meta };
        });
      }

      this.file = null;
    },
    download() {
      const canvas = this.getCanvas();
      if (!canvas) return;
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "image.png";
        a.click();
        URL.revokeObjectURL(a.href);
      });
    },
  },
};
</script>

<style scoped>
.sidebar {
  position: fixed;
  right: 0;
  top: 0;
  height: 100%;
  width: 340px;
  background: #ffffff;
  padding: 24px 20px;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.1);
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: "Segoe UI", Roboto, sans-serif;
  border-left: 1px solid #ddd;
}

h2 {
  font-size: 20px;
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

input[type="file"] {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f9f9f9;
  cursor: pointer;
}

button {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

button:hover:not(:disabled) {
  background-color: #0069d9;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.scale {
  background-color: #28a745;
}

button:hover:not(:disabled) {
  background-color: #218838;
}

.info {
  background: #f3f4f6;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 14px;
  color: #333;
}

.info p {
  margin: 6px 0;
}

.close {
  margin-top: auto;
  background-color: #dc3545;
}

.close:hover {
  background-color: #c82333;
}
</style>
