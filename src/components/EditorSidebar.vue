<template>
  <div class="sidebar" v-if="visible">
    <h2>Редактор</h2>

    <input type="file" @change="onFileChange" accept=".gb7,.png,.jpg,.jpeg" />
    <div class="info" v-if="layers.length">
      <p><strong>Слои и альфа-каналы</strong></p>
      <button style="margin-top: 6px;" @click="addColorLayer" :disabled="!canAddLayer">
        Добавить слой
      </button>

      <ul class="layer-list">
        <li v-for="(layer, index) in layers" :key="index" :class="{ active: index === activeLayerIndex }">
          <div class="layer-header">
            <strong>{{ layer.name }}</strong>
            <canvas class="preview" ref="previews" width="32" height="32"></canvas>

            <button @click="removeLayer(index)" title="Удалить слой">🗑️</button>
          </div>
          <div class="layer-controls">
            <label>
              <input type="checkbox" v-model="layer.visible" />
              Показать
            </label>
            <label>
              Непрозрачность:
              <input type="range" v-model.number="layer.opacity" min="0" max="1" step="0.01" />
            </label>
            <label>
              Режим:
              <select class="select" v-model="layer.blendMode" :title="currentBlendModeTooltip(layer.blendMode)">
                <option v-for="mode in blendModes" :key="mode.value" :value="mode.value">
                  {{ mode.label }}
                </option>
              </select>
            </label>

            <div class="btn-layer">
              <button @click="moveLayerUp(index)" :disabled="index === 0">🔼</button>
              <button @click="moveLayerDown(index)" :disabled="index === layers.length - 1">🔽</button>
            </div>

          </div>
        </li>
      </ul>
    </div>


    <div v-if="imageMeta" class="info info-image">
      <p><strong>Ширина:</strong> {{ imageMeta.width }} px</p>
      <p><strong>Высота:</strong> {{ imageMeta.height }} px</p>
      <p><strong>Глубина:</strong> {{ depthInfo }}</p>
      <di class="btn-flex">
        <button @click="download">Скачать PNG</button>
        <button class="scale" @click="openScaleDialog(imageMeta)" :disabled="!imageMeta">
          Масштабировать
        </button>
      </di>


    </div>


    <div v-if="primaryColor || secondaryColor" class="info">
      <p><strong>Сравнение цветов</strong></p>

      <div class="preview-row">
        <div class="color-preview" v-if="primaryColor" :style="previewStyle(primaryColor.color.rgb)">Цвет 1</div>
        <div class="color-preview" v-if="secondaryColor" :style="previewStyle(secondaryColor.color.rgb)">Цвет 2</div>
      </div>

      <table class="color-table">
        <thead>
          <tr>
            <th>Формат</th>
            <th v-if="primaryColor">Цвет 1</th>
            <th v-if="secondaryColor">Цвет 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="tooltip" title="Координаты пикселя">Координаты</span></td>
            <td v-if="primaryColor">{{ primaryColor.x }}, {{ primaryColor.y }}</td>
            <td v-if="secondaryColor">{{ secondaryColor.x }}, {{ secondaryColor.y }}</td>
          </tr>
          <tr>
            <td><span class="tooltip" title="RGB — 0–255">RGB</span></td>
            <td v-if="primaryColor">{{ primaryColor.color.rgb.map(round).join(', ') }}</td>
            <td v-if="secondaryColor">{{ secondaryColor.color.rgb.map(round).join(', ') }}</td>
          </tr>
          <tr>
            <td><span class="tooltip" title="XYZ — физические цветовые координаты">XYZ</span></td>
            <td v-if="primaryColor">{{ xyzString(primaryColor.color.rgb) }}</td>
            <td v-if="secondaryColor">{{ xyzString(secondaryColor.color.rgb) }}</td>
          </tr>
          <tr>
            <td><span class="tooltip" title="Lab — светлота и цветовые оси">Lab</span></td>
            <td v-if="primaryColor">{{ labString(primaryColor.color.rgb) }}</td>
            <td v-if="secondaryColor">{{ labString(secondaryColor.color.rgb) }}</td>
          </tr>
          <tr>
            <td><span class="tooltip" title="OKLCH — современная цветовая модель">OKLCH</span></td>
            <td v-if="primaryColor">{{ formatOklch(primaryColor.color.oklch) }}</td>
            <td v-if="secondaryColor">{{ formatOklch(secondaryColor.color.oklch) }}</td>
          </tr>
          <tr v-if="primaryColor && secondaryColor">
            <td><span class="tooltip"
                title="Контрастность по стандарту WCAG (минимум 4.5 для текста)">Контрастность</span></td>
            <td colspan="2">{{ getContrastRatio(primaryColor.color.rgb, secondaryColor.color.rgb) }} : 1</td>
          </tr>

        </tbody>
      </table>
    </div>

  </div>
</template>

<script>
import {
  parseGB7,
  renderGB7ToCanvas,
  renderImageToCanvas,
} from "../utils/imageProcessor";
import { rgbToXyz, xyzToLab, contrastRatio } from "../utils/colorUtils";


export default {
  name: "EditorSidebar",
  props: {
    visible: Boolean,
    getCanvas: Function,
    openScaleDialog: Function,
    primaryColor: Object,
    secondaryColor: Object,
  },
  data() {
    return {
      file: null,
      imageMeta: null,
      layers: [],
      newLayerColor: "#ff0000",
      blendModes: [
        {
          label: "Обычный",
          value: "normal",
          tooltip: "Стандартный режим. Верхний слой перекрывает нижний в зависимости от прозрачности."
        },
        {
          label: "Умножение",
          value: "multiply",
          tooltip: "Цвета перемножаются. Результат всегда темнее. Используется для теней."
        },
        {
          label: "Экран",
          value: "screen",
          tooltip: "Обратное к умножению. Делает изображение светлее, используется для бликов и свечения."
        },
        {
          label: "Наложение",
          value: "overlay",
          tooltip: "Комбинация умножения и экрана. Сохраняет тени и светлые участки одновременно."
        }
      ]
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
    canAddLayer() {
      return this.layers.length < 2;
    },
  },
  methods: {
    addColorLayer() {
      if (!this.canAddLayer) return;

      const canvas = this.getCanvas();
      let width = 256;
      let height = 256;

      if (this.imageMeta) {
        width = this.imageMeta.width;
        height = this.imageMeta.height;
      } else if (canvas) {
        width = canvas.width;
        height = canvas.height;
      }

      const layerCanvas = document.createElement("canvas");
      layerCanvas.width = width;
      layerCanvas.height = height;

      const ctx = layerCanvas.getContext("2d");
      ctx.fillStyle = this.newLayerColor;
      ctx.fillRect(0, 0, width, height);

      this.layers.push({
        name: `Слой ${this.layers.length + 1}`,
        color: this.newLayerColor,
        canvas: layerCanvas,
        visible: true,
        opacity: 1,
        blendMode: "normal",
      });

      this.renderLayersToMainCanvas();
    },

    onFileChange(e) {
      this.file = e.target.files[0];
      if (this.file) this.loadImage();
    },
    loadImage() {
      const file = this.file;
      const canvas = this.getCanvas();
      if (!file || !canvas || !this.canAddLayer) return;

      const ext = file.name.split(".").pop().toLowerCase();

      const addLoadedLayer = (meta) => {
        this.imageMeta = { ...meta };

        const layerCanvas = document.createElement("canvas");
        layerCanvas.width = meta.width;
        layerCanvas.height = meta.height;
        const ctx = layerCanvas.getContext("2d");
        ctx.drawImage(canvas, 0, 0);

        this.layers.push({
          name: `Слой ${this.layers.length + 1}`,
          canvas: layerCanvas,
          visible: true,
          opacity: 1,
          blendMode: "normal",
        });

        this.renderLayersToMainCanvas();
      };

      if (ext === "gb7") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const parsed = parseGB7(e.target.result);
          const meta = renderGB7ToCanvas(canvas, parsed);
          addLoadedLayer(meta);
        };
        reader.readAsArrayBuffer(file);
      } else {
        renderImageToCanvas(canvas, file, (meta) => {
          addLoadedLayer(meta);
        });
      }

      this.file = null;
    },
    currentBlendModeTooltip(mode) {
      const found = this.blendModes.find(m => m.value === mode);
      return found ? found.tooltip : "";
    },
    renderLayersToMainCanvas() {
      const canvas = this.getCanvas();
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      const blendModeMap = {
        normal: "source-over",
        multiply: "multiply",
        screen: "screen",
        overlay: "overlay"
      };

      for (const layer of this.layers) {
        if (!layer.visible) continue;

        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = blendModeMap[layer.blendMode] || "source-over";
        ctx.drawImage(layer.canvas, 0, 0);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
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
    rgbString(rgb) {
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    },
    formatOklch(oklch) {
      return oklch.map(v => v.toFixed(3)).join(', ');
    },
    round(v) {
      return Math.round(v);
    },
    xyzString(rgb) {
      const xyz = rgbToXyz(rgb);
      return xyz.map(v => v.toFixed(4)).join(', ');
    },
    labString(rgb) {
      const lab = xyzToLab(rgbToXyz(rgb));
      return lab.map(v => v.toFixed(3)).join(', ');
    },
    getTextColor(rgb) {
      const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
      return luminance > 0.5 ? '#000' : '#fff';
    },
    getContrastRatio(rgb1, rgb2) {
      return contrastRatio(rgb1, rgb2);
    },
    previewStyle(rgb) {
      return {
        backgroundColor: this.rgbString(rgb),
        color: this.getTextColor(rgb),
        padding: '8px 12px',
        borderRadius: '6px',
        fontWeight: 'bold',
        marginBottom: '8px',
        textAlign: 'center',
        border: '1px solid #ccc'
      };
    },
    setActiveLayer(index) {
      this.activeLayerIndex = index;
    },
    removeLayer(index) {
      this.layers.splice(index, 1);
      if (this.activeLayerIndex >= this.layers.length) {
        this.activeLayerIndex = this.layers.length - 1;
      }
    },
    moveLayerUp(index) {
      if (index === 0) return;
      const temp = this.layers[index - 1];
      this.layers[index - 1] = this.layers[index];
      this.layers[index] = temp;
      this.activeLayerIndex = index - 1;
    },
    moveLayerDown(index) {
      if (index === this.layers.length - 1) return;
      const temp = this.layers[index + 1];
      this.layers[index + 1] = this.layers[index];
      this.layers[index] = temp;
      this.activeLayerIndex = index + 1;
    },
  },
  updated() {
    if (!this.$refs.previews) return;

    const previews = Array.isArray(this.$refs.previews)
      ? this.$refs.previews
      : [this.$refs.previews];

    this.layers.forEach((layer, index) => {
      const preview = previews[index];
      if (preview && preview.getContext) {
        const ctx = preview.getContext("2d");
        ctx.clearRect(0, 0, preview.width, preview.height);
        ctx.drawImage(layer.canvas, 0, 0, preview.width, preview.height);
      }
    });
  },

  watch: {
    layers: {
      deep: true,
      handler() {
        this.renderLayersToMainCanvas();
      }
    }
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
  gap: 2px;
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

button.scale:hover:not(:disabled) {
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

.color-table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.color-table td {
  padding: 4px 6px;
  vertical-align: top;
}

.tooltip {
  border-bottom: 1px dotted #999;
  cursor: help;
}

.color-preview {
  font-size: 14px;
}

.preview-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.color-table th {
  text-align: left;
  font-weight: 600;
  padding: 6px;
  background: #f0f0f0;
}

.layer-list {
  padding: 0;
  margin: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layer-list li {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px;
  background: #fff;
}

.layer-list li.active {
  border-color: #007bff;
  background-color: #eef5ff;
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.layer-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.info-image {
  position: absolute;
  left: -190px;
}

.color-table {
  width: 100%;
  font-size: 11px;
  border-collapse: collapse;
  table-layout: fixed;
}

.color-table th,
.color-table td {
  padding: 2px 4px;
  border: 1px solid #ddd;
  text-align: left;
  vertical-align: middle;
}

.color-table th {
  background-color: #f7f7f7;
  font-weight: 600;
}

.color-table .tooltip {
  cursor: help;
  border-bottom: 1px dotted #aaa;
  white-space: nowrap;
}

.btn-flex {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  flex-direction: column;
}

.btn-layer {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.blend-tooltip {
  font-size: 12px;
  color: #555;
  margin-top: 4px;
  background: #f9f9f9;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.select {
  border: #d90000 1px solid;
  padding: 1px;
  border-radius: 8px;
}
</style>

