<template>
  <div class="filter-dialog" v-if="visible">
    <div class="dialog-content">
      <h3>Фильтрация изображения</h3>
      
      <div class="presets">
        <select v-model="selectedPreset" @change="applyPreset">
          <option value="identity">Тождественное отображение</option>
          <option value="sharpen">Повышение резкости</option>
          <option value="gaussian">Фильтр Гаусса (3x3)</option>
          <option value="box">Прямоугольное размытие</option>
          <option value="prewitt1">Оператор Прюитта 1</option>
          <option value="prewitt2">Оператор Прюитта 2</option>
          <option value="custom">Пользовательский</option>
        </select>
      </div>

      <div class="kernel-grid">
        <div v-for="(value, index) in kernel" :key="index" class="kernel-cell">
          <input type="number" v-model.number="kernel[index]" step="0.1" />
        </div>
      </div>

      <div class="buttons">
        <button @click="apply">Применить</button>
        <button @click="close">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
const presets = {
  identity: [
    0, 0, 0,
    0, 1, 0,
    0, 0, 0
  ],
  sharpen: [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
  ],
  gaussian: [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ],
  box: [
    1, 1, 1,
    1, 1, 1,
    1, 1, 1
  ],
  prewitt1: [
    -1, -1, -1,
    0, 0, 0,
    1, 1, 1
  ],
  prewitt2: [
    -1, 0, 1,
    -1, 0, 1,
    -1, 0, 1
  ]
};

export default {
  name: 'ImageFilter',
  props: {
    visible: Boolean,
    imageData: Object,
    isAlphaChannel: Boolean
  },
  data() {
    return {
      kernel: [...presets.identity],
      selectedPreset: 'identity',
      worker: null,
      originalImageData: null
    }
  },
  watch: {
    imageData: {
      immediate: true,
      handler(newData) {
        if (newData?.data) {
          this.originalImageData = new Uint8ClampedArray(newData.data);
        }
      }
    }
  },
  created() {
    this.worker = new Worker(new URL('../utils/filterWorker.js', import.meta.url));
  },
  beforeUnmount() {
    if (this.worker) {
      this.worker.terminate();
    }
  },
  methods: {
    applyPreset() {
      if (this.selectedPreset !== 'custom') {
        this.kernel = [...presets[this.selectedPreset]];
      }
    },
    async apply() {
      if (!this.originalImageData || !this.imageData) return;
      
      const data = new Uint8ClampedArray(this.originalImageData);
      const width = this.imageData.width;
      const height = this.imageData.height;

      // Нормализуем ядро для некоторых фильтров
      let normalizedKernel = [...this.kernel];
      if (this.selectedPreset === 'gaussian') {
        const sum = normalizedKernel.reduce((a, b) => a + b, 0);
        normalizedKernel = normalizedKernel.map(v => v / sum);
      } else if (this.selectedPreset === 'box') {
        const sum = normalizedKernel.reduce((a, b) => a + b, 0);
        normalizedKernel = normalizedKernel.map(v => v / sum);
      }

      const transferData = {
        data: data.buffer,
        width: width,
        height: height,
        kernel: normalizedKernel,
        isAlphaChannel: this.isAlphaChannel
      };

      // Создаем Promise для обработки результата
      const result = await new Promise((resolve) => {
        this.worker.onmessage = (e) => {
          const result = new ImageData(new Uint8ClampedArray(e.data), width, height);
          resolve(result);
        };
        this.worker.postMessage(transferData, [data.buffer]);
      });

      this.$emit('apply', result);
      this.close();
    },
    close() {
      this.$emit('close');
    }
  }
}
</script>

<style scoped>
.filter-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.presets select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 14px;
}

.kernel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 16px 0;
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.kernel-cell input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #0056b3;
}
</style> 