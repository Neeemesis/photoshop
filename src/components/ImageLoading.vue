<template>
  <div class="image-uploader">
    <h1>Photoshop</h1>

    <!-- Ввод файла изображения -->
    <input type="file" @change="handleFileSelection" accept=".png, .jpg, .jpeg, .gb7" />

    <!-- Кнопка загрузки изображения -->
    <button @click="uploadImage" :disabled="!selectedFile">Загрузить изображение</button>

    <!-- Информация о загруженном изображении -->
    <div v-if="imageUploaded" class="image-info">
      <p>Ширина: {{ imageWidthPx }} px</p>
      <p>Высота: {{ imageHeightPx }} px</p>
      <p>Глубина: {{ imageDepthInfo }}</p>
    </div>

    <!-- Канвас для отображения изображения -->
    <canvas ref="imageCanvas"></canvas>
  </div>
</template>

<script>
export default {
  name: 'ImageLoading',

  data() {
    return {
      selectedFile: null, // выбранный файл изображения
      imageUploaded: false, // флаг, что изображение загружено
      imageWidthPx: 0, // ширина изображения
      imageHeightPx: 0, // высота изображения
      alphaChannelDetected: false, // флаг, есть ли альфа-канал
      grayscale7Bit: false, // флаг, изображение 7-битного серого
      hasAlphaMask: false, // флаг наличия маски
    };
  },

  computed: {
    imageDepthInfo() {
      if (!this.imageUploaded) return "—";
      if (this.grayscale7Bit) {
        return `7-бит серого${this.hasAlphaMask ? " + маска" : ""}`;
      }
      return this.alphaChannelDetected ? "32-бит RGBA" : "24-бит RGB";
    }
  },

  methods: {
    handleFileSelection(event) {
      this.selectedFile = event.target.files[0];
    },

    resetFileInput() {
      this.selectedFile = null;
    },

    uploadImage() {
      if (!this.selectedFile) return;

      const file = this.selectedFile;
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (fileExtension === "gb7") {
        const reader = new FileReader();
        reader.onload = (e) => {
          const bytes = new Uint8Array(e.target.result);
          const mask = bytes[5] !== 0;
          const width = (bytes[6] << 8) | bytes[7];
          const height = (bytes[8] << 8) | bytes[9];
          const pixelData = bytes.slice(12);

          this.imageWidthPx = width;
          this.imageHeightPx = height;
          this.hasAlphaMask = mask;
          this.grayscale7Bit = true;
          this.imageUploaded = true;

          this.$nextTick(() => {
            const ctx = this.$refs.imageCanvas?.getContext("2d");
            this.$refs.imageCanvas.width = width;
            this.$refs.imageCanvas.height = height;

            const imgData = ctx.createImageData(width, height);
            const data = imgData.data;

            for (let i = 0; i < width * height; i++) {
              const byte = pixelData[i];
              const gray7 = Math.floor(((byte & 0b01111111) / 127) * 255);
              const alpha = mask ? (byte >> 7) * 255 : 255;

              const j = i * 4;
              data[j] = gray7;
              data[j + 1] = gray7;
              data[j + 2] = gray7;
              data[j + 3] = alpha;
            }

            ctx.putImageData(imgData, 0, 0);
          });
        };
        reader.readAsArrayBuffer(file);
      } else {
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          const ctx = this.$refs.imageCanvas?.getContext("2d");
          this.$refs.imageCanvas.width = img.width;
          this.$refs.imageCanvas.height = img.height;

          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;

          let alphaDetected = false;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 255) {
              alphaDetected = true;
              break;
            }
          }

          this.imageWidthPx = img.width;
          this.imageHeightPx = img.height;
          this.alphaChannelDetected = alphaDetected;
          this.grayscale7Bit = false;
          this.imageUploaded = true;

          URL.revokeObjectURL(imageUrl);
          this.resetFileInput();
        };

        img.src = imageUrl;
      }
    }
  }
};
</script>

<style scoped>
.image-uploader {
  overflow: auto;
  background-color: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 6px;
  padding: 10px;
}

.image-info {
  font-size: 16px;
}

#imageCanvas {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}
</style>
