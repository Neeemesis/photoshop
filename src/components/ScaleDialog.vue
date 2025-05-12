<template>
  <dialog ref="dialogRef" class="scale-dialog">
    <form @submit.prevent="applyScale">
      <h3>Масштабирование изображения</h3>

      <div class="info">
        <p>
          Исходный размер: {{ originalWidth }} × {{ originalHeight }} px ({{
            originalMP
          }}
          Мп)
        </p>
        <p>Новый размер: {{ scaledWidth }} × {{ scaledHeight }} px ({{ scaledMP }} Мп)</p>
      </div>

      <label>
        Единицы измерения:
        <select v-model="mode">
          <option value="percent">Проценты</option>
          <option value="pixels">Пиксели</option>
        </select>
      </label>

      <div v-if="mode === 'percent'">
        <label>
          Масштаб:
          <input type="range" min="12" max="300" step="1" v-model.number="scalePercent" />
          <span>{{ scalePercent }}%</span>
        </label>
      </div>

      <div v-else class="px-inputs">
        <label>
          Ширина:
          <input
            type="number"
            min="1"
            :max="maxPx"
            v-model.number="widthPx"
            @input="onWidthChange"
          />
        </label>

        <label>
          Высота:
          <input
            type="number"
            min="1"
            :max="maxPx"
            v-model.number="heightPx"
            @input="onHeightChange"
            :disabled="keepRatio"
          />
        </label>

        <label class="checkbox">
          <input type="checkbox" v-model="keepRatio" />
          Сохранять пропорции
        </label>
      </div>

      <label>
        Интерполяция:
        <select v-model="algorithm" title="Билинейная — плавно, Ближайший — резче">
          <option value="bilinear">Билинейная</option>
          <option value="nearest">Ближайший сосед</option>
        </select>
      </label>

      <div class="buttons">
        <button type="submit">Применить</button>
        <button type="button" @click="closeDialog">Отмена</button>
      </div>
    </form>
  </dialog>
</template>

<script>
import { scaleImage } from "../utils/imageScaler";

export default {
  name: "ScaleDialog",
  props: {
    getCanvas: Function,
    originalSize: Object,
  },
  data() {
    return {
      mode: "percent",
      scalePercent: 100,
      algorithm: "bilinear",
      widthPx: 1,
      heightPx: 1,
      keepRatio: true,
    };
  },
  computed: {
    originalWidth() {
      return this.originalSize?.width || 1;
    },
    originalHeight() {
      return this.originalSize?.height || 1;
    },
    scaledWidth() {
      return this.mode === "percent"
        ? Math.round((this.originalWidth * this.scalePercent) / 100)
        : this.widthPx;
    },
    scaledHeight() {
      return this.mode === "percent"
        ? Math.round((this.originalHeight * this.scalePercent) / 100)
        : this.heightPx;
    },
    originalMP() {
      return ((this.originalWidth * this.originalHeight) / 1_000_000).toFixed(2);
    },
    scaledMP() {
      return ((this.scaledWidth * this.scaledHeight) / 1_000_000).toFixed(2);
    },
    maxPx() {
      return 10000; // ограничение на ручной ввод пикселей
    },
  },
  methods: {
    openDialog() {
      this.scalePercent = 100;
      this.mode = "percent";
      this.widthPx = this.originalWidth;
      this.heightPx = this.originalHeight;
      this.keepRatio = true;
      this.$refs.dialogRef.showModal();
    },
    closeDialog() {
      this.$refs.dialogRef.close();
    },
    applyScale() {
      const canvas = this.getCanvas();
      scaleImage(canvas, this.scaledWidth, this.scaledHeight, this.algorithm);
      this.closeDialog();
    },
    onWidthChange() {
      if (this.keepRatio) {
        this.heightPx = Math.round(
          (this.widthPx * this.originalHeight) / this.originalWidth
        );
      }
    },
    onHeightChange() {
      if (this.keepRatio) {
        this.widthPx = Math.round(
          (this.heightPx * this.originalWidth) / this.originalHeight
        );
      }
    },
  },
};
</script>

<style scoped>
.scale-dialog {
  padding: 24px;
  border-radius: 12px;
  width: 360px;
  max-width: 90vw;
  border: none;
  background: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
  font-family: "Segoe UI", Roboto, sans-serif;
  color: #333;
}

h3 {
  margin-top: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

p {
  font-size: 14px;
  margin: 6px 0;
}

label {
  display: block;
  margin: 14px 0 6px;
  font-size: 14px;
  font-weight: 500;
}

input[type="range"] {
  width: 100%;
}

input[type="number"] {
  width: 100%;
  padding: 6px 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  margin-top: 6px;
}

select {
  width: 100%;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f9f9f9;
  color: #333;
}

.px-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: end;
}

.checkbox {
  grid-column: span 2;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
}

button {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

button[type="submit"] {
  background: #007bff;
  color: white;
}

button[type="submit"]:hover {
  background: #0069d9;
}

button[type="button"] {
  background: #e0e0e0;
  color: #333;
}

button[type="button"]:hover {
  background: #cfcfcf;
}
</style>
