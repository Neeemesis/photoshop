<template>
    <div class="gradation-dialog" v-if="visible">
        <div class="dialog-content">
            <h3>Градационная коррекция</h3>

            <div class="histogram-container">
                <svg width="256" height="256" viewBox="0 0 256 256">
                    <!-- Сетка -->
                    <g class="grid">
                        <line v-for="i in 4" :key="'h' + i" :x1="0" :y1="i * 64" :x2="256" :y2="i * 64"
                            stroke="#e0e0e0" />
                        <line v-for="i in 4" :key="'v' + i" :x1="i * 64" :y1="0" :x2="i * 64" :y2="256"
                            stroke="#e0e0e0" />
                    </g>

                    <!-- Гистограммы -->
                    <polyline :points="rPoints" fill="none" stroke="#ff4444" stroke-width="1" />
                    <polyline :points="gPoints" fill="none" stroke="#44ff44" stroke-width="1" />
                    <polyline :points="bPoints" fill="none" stroke="#4444ff" stroke-width="1" />

                    <!-- Кривая коррекции -->
                    <polyline :points="curvePoints" stroke="#007bff" stroke-width="2" />
                    <circle :cx="point1.x" :cy="255 - point1.y" r="4" fill="#fff" stroke="#007bff" />
                    <circle :cx="point2.x" :cy="255 - point2.y" r="4" fill="#fff" stroke="#007bff" />
                </svg>
            </div>

            <div class="controls">
                <div class="point-controls">
                    <div class="point">
                        <label>Вход 1:</label>
                        <input type="number" v-model.number="point1.x" min="0" max="255" @input="validatePoints" />
                        <label>Выход 1:</label>
                        <input type="number" v-model.number="point1.y" min="0" max="255" @input="validatePoints" />
                    </div>
                    <div class="point">
                        <label>Вход 2:</label>
                        <input type="number" v-model.number="point2.x" min="0" max="255" @input="validatePoints" />
                        <label>Выход 2:</label>
                        <input type="number" v-model.number="point2.y" min="0" max="255" @input="validatePoints" />
                    </div>
                </div>

                <div class="buttons">
                    <button @click="apply">Применить</button>
                    <button @click="close">Закрыть</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'GradationCorrection',
    props: {
        visible: Boolean,
        imageData: Object,
        isAlphaChannel: Boolean
    },
    data() {
        return {
            point1: { x: 0, y: 0 },
            point2: { x: 255, y: 255 },
            histograms: {
                r: new Array(256).fill(0),
                g: new Array(256).fill(0),
                b: new Array(256).fill(0)
            },
            originalImageData: null
        }
    },
    computed: {
        rPoints() {
            return this.histograms.r.map((v, i) => `${i},${255 - v}`).join(' ');
        },
        gPoints() {
            return this.histograms.g.map((v, i) => `${i},${255 - v}`).join(' ');
        },
        bPoints() {
            return this.histograms.b.map((v, i) => `${i},${255 - v}`).join(' ');
        },
        curvePoints() {
            const points = [];
            for (let i = 0; i < 256; i++) {
                let y;
                if (this.point1.x === 0) {
                    y = this.point1.y;
                } else if (i <= this.point1.x) {
                    y = Math.round((this.point1.y / this.point1.x) * i);
                } else if (i >= this.point2.x) {
                    if (this.point2.x === 255) {
                        y = this.point2.y;
                    } else {
                        y = Math.round(((255 - this.point2.y) / (255 - this.point2.x)) * (i - this.point2.x) + this.point2.y);
                    }
                } else {
                    const dx = this.point2.x - this.point1.x;
                    if (dx === 0) {
                        y = this.point1.y;
                    } else {
                        y = Math.round(((this.point2.y - this.point1.y) / dx) * (i - this.point1.x) + this.point1.y);
                    }
                }
                y = Math.max(0, Math.min(255, y));
                points.push(`${i},${255 - y}`);
            }
            return points.join(' ');
        }
    },
    watch: {
        imageData: {
            immediate: true,
            handler(newData) {
                if (newData?.data) {
                    this.originalImageData = new Uint8ClampedArray(newData.data);
                    this.calculateHistograms(newData);
                }
            }
        },
        'point1.x'() {
            this.validatePoints();
            this.applyPreview();
        },
        'point1.y'() {
            this.validatePoints();
            this.applyPreview();
        },
        'point2.x'() {
            this.validatePoints();
            this.applyPreview();
        },
        'point2.y'() {
            this.validatePoints();
            this.applyPreview();
        }
    },
    methods: {
        validatePoints() {
            // Ограничение значений
            this.point1.x = Math.max(0, Math.min(255, this.point1.x));
            this.point1.y = Math.max(0, Math.min(255, this.point1.y));
            this.point2.x = Math.max(0, Math.min(255, this.point2.x));
            this.point2.y = Math.max(0, Math.min(255, this.point2.y));

            // Предотвращение пересечения точек
            if (this.point1.x >= this.point2.x) {
                this.point2.x = this.point1.x + 1;
                if (this.point2.x > 255) {
                    this.point2.x = 255;
                    this.point1.x = 254;
                }
            }
        },
        calculateHistograms(imageData) {
            const data = imageData.data;
            const histograms = {
                r: new Array(256).fill(0),
                g: new Array(256).fill(0),
                b: new Array(256).fill(0)
            };

            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3];
                if (a === 0) continue;
                histograms.r[data[i]]++;
                histograms.g[data[i + 1]]++;
                histograms.b[data[i + 2]]++;
            }

            // Нормализация
            const max = Math.max(...Object.values(histograms).flat());
            if (max > 0) {
                for (let channel in histograms) {
                    for (let i = 0; i < 256; i++) {
                        histograms[channel][i] = Math.round((histograms[channel][i] / max) * 200);
                    }
                }
            }

            this.histograms = histograms;
        },
        apply() {
            if (!this.originalImageData || !this.imageData) return;

            const data = new Uint8ClampedArray(this.originalImageData);
            const table = new Uint8ClampedArray(256);
            
            // Создаем таблицу преобразования
            for (let i = 0; i < 256; i++) {
                if (i <= this.point1.x) {
                    table[i] = Math.round((this.point1.y / this.point1.x) * i);
                } else if (i >= this.point2.x) {
                    table[i] = Math.round(((255 - this.point2.y) / (255 - this.point2.x)) * (i - this.point2.x) + this.point2.y);
                } else {
                    table[i] = Math.round(((this.point2.y - this.point1.y) / (this.point2.x - this.point1.x)) * (i - this.point1.x) + this.point1.y);
                }
            }
            
            // Применяем преобразование
            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3];
                if (a === 0) continue;

                if (this.isAlphaChannel) {
                    data[i + 3] = table[data[i + 3]];
                } else {
                    data[i] = table[data[i]];
                    data[i + 1] = table[data[i + 1]];
                    data[i + 2] = table[data[i + 2]];
                }
            }

            const result = new ImageData(data, this.imageData.width, this.imageData.height);
            this.$emit('apply', result);
            this.close();
        },
        close() {
            this.$emit('close');
        },
        applyPreview() {
            if (!this.originalImageData || !this.imageData) return;

            const data = new Uint8ClampedArray(this.originalImageData);
            const table = new Uint8ClampedArray(256);
            
            // Создаем таблицу преобразования
            for (let i = 0; i < 256; i++) {
                if (this.point1.x === 0) {
                    table[i] = this.point1.y;
                } else if (i <= this.point1.x) {
                    table[i] = Math.round((this.point1.y / this.point1.x) * i);
                } else if (i >= this.point2.x) {
                    if (this.point2.x === 255) {
                        table[i] = this.point2.y;
                    } else {
                        table[i] = Math.round(((255 - this.point2.y) / (255 - this.point2.x)) * (i - this.point2.x) + this.point2.y);
                    }
                } else {
                    const dx = this.point2.x - this.point1.x;
                    if (dx === 0) {
                        table[i] = this.point1.y;
                    } else {
                        table[i] = Math.round(((this.point2.y - this.point1.y) / dx) * (i - this.point1.x) + this.point1.y);
                    }
                }
            }
            
            // Применяем преобразование
            for (let i = 0; i < data.length; i += 4) {
                const a = data[i + 3];
                if (a === 0) continue;

                if (this.isAlphaChannel) {
                    data[i + 3] = table[data[i + 3]];
                } else {
                    data[i] = table[data[i]];
                    data[i + 1] = table[data[i + 1]];
                    data[i + 2] = table[data[i + 2]];
                }
            }

            const result = new ImageData(data, this.imageData.width, this.imageData.height);
            this.$emit('preview', result);
        }
    }
}
</script>

<style scoped>
.gradation-dialog {
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

.histogram-container {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
}

svg {
    background: white;
    border-radius: 4px;
}

.controls {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.point-controls {
    display: flex;
    gap: 16px;
}

.point {
    display: flex;
    align-items: center;
    gap: 8px;
}

.point input {
    width: 60px;
    padding: 4px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.buttons {
    display: flex;
    gap: 8px;
    align-items: center;
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