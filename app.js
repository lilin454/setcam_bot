// Set game AI assistant application
class CameraManager {
  constructor() {
    this.stream = null;
    this.video = document.getElementById('camera-video');
    this.currentFacingMode = 'environment'; // 後置鏡頭
    this.isActive = false;
  }

  async startCamera() {
    try {
      // 檢查瀏覽器支援
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的瀏覽器不支援攝像頭功能，請使用現代瀏覽器');
      }

      const constraints = {
        video: {
          facingMode: this.currentFacingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.isActive = true;
      
      return new Promise((resolve, reject) => {
        this.video.onloadedmetadata = () => {
          this.video.play().then(resolve).catch(reject);
        };
        this.video.onerror = () => {
          reject(new Error('視訊載入失敗'));
        };
      });
    } catch (error) {
      this.isActive = false;
      if (error.name === 'NotAllowedError') {
        throw new Error('請允許攝像頭權限以使用此功能');
      } else if (error.name === 'NotFoundError') {
        throw new Error('未找到可用的攝像頭設備');
      } else if (error.name === 'NotReadableError') {
        throw new Error('攝像頭被其他應用程式占用');
      } else {
        throw new Error(`攝像頭啟動失敗: ${error.message}`);
      }
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      this.video.srcObject = null;
      this.isActive = false;
    }
  }

  async switchCamera() {
    this.currentFacingMode = this.currentFacingMode === 'user' ? 'environment' : 'user';
    if (this.stream) {
      this.stopCamera();
      await this.startCamera();
    }
  }

  getVideoElement() {
    return this.video;
  }
}

class ImageProcessor {
  constructor(video, canvas) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.detectionSensitivity = 'medium';
  }

  captureFrame() {
    if (!this.video.videoWidth || !this.video.videoHeight) {
      return null;
    }

    // 設置 Canvas 尺寸匹配影片
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    
    // 繪製當前幀到 Canvas
    this.ctx.drawImage(this.video, 0, 0);
    
    // 獲取影像數據
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  detectCards(imageData) {
    if (!imageData) return [];

    try {
      // 基本卡片檢測邏輯
      const regions = this.findCardRegions(imageData);
      return regions.map(region => this.extractCardFeatures(region));
    } catch (error) {
      console.error('卡片檢測錯誤:', error);
      return [];
    }
  }

  findCardRegions(imageData) {
    // 簡化的卡片區域檢測
    // 在實際應用中，這裡會使用更複雜的計算機視覺算法
    const mockRegions = [];
    
    // 模擬檢測到的卡片區域，基於實際影像尺寸
    const cardCount = Math.floor(Math.random() * 4) + 2; // 2-5張卡片
    const cardWidth = Math.min(imageData.width / 4, 120);
    const cardHeight = cardWidth * 1.4; // 卡片比例
    
    for (let i = 0; i < cardCount; i++) {
      const x = Math.random() * (imageData.width - cardWidth);
      const y = Math.random() * (imageData.height - cardHeight);
      
      mockRegions.push({
        x: x,
        y: y,
        width: cardWidth,
        height: cardHeight,
        confidence: 0.6 + Math.random() * 0.4
      });
    }
    
    return mockRegions;
  }

  extractCardFeatures(region) {
    // 模擬特徵提取
    const features = {
      number: this.detectNumber(region),
      shape: this.detectShape(region),
      color: this.detectColor(region),
      shading: this.detectShading(region),
      region: region,
      confidence: region.confidence
    };
    
    return features;
  }

  detectNumber(region) {
    // 簡化的數量檢測
    const numbers = [1, 2, 3];
    return numbers[Math.floor(Math.random() * numbers.length)];
  }

  detectShape(region) {
    // 簡化的形狀檢測
    const shapes = ['oval', 'diamond', 'squiggle'];
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  detectColor(region) {
    // 簡化的顏色檢測
    const colors = ['red', 'green', 'purple'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  detectShading(region) {
    // 簡化的填充檢測
    const shadings = ['solid', 'striped', 'open'];
    return shadings[Math.floor(Math.random() * shadings.length)];
  }

  setSensitivity(sensitivity) {
    this.detectionSensitivity = sensitivity;
  }
}

class SetGameLogic {
  constructor() {
    this.validFeatures = {
      number: [1, 2, 3],
      shape: ['oval', 'diamond', 'squiggle'],
      color: ['red', 'green', 'purple'],
      shading: ['solid', 'striped', 'open']
    };
    
    this.featureLabels = {
      number: { 1: '1個', 2: '2個', 3: '3個' },
      shape: { 'oval': '橢圓', 'diamond': '菱形', 'squiggle': '波浪' },
      color: { 'red': '紅色', 'green': '綠色', 'purple': '紫色' },
      shading: { 'solid': '實心', 'striped': '條紋', 'open': '空心' }
    };
  }

  findSets(cards) {
    const sets = [];
    
    // 檢查所有可能的三張卡片組合
    for (let i = 0; i < cards.length - 2; i++) {
      for (let j = i + 1; j < cards.length - 1; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          if (this.isValidSet(cards[i], cards[j], cards[k])) {
            sets.push({
              cards: [cards[i], cards[j], cards[k]],
              confidence: Math.min(cards[i].confidence, cards[j].confidence, cards[k].confidence)
            });
          }
        }
      }
    }
    
    return sets;
  }

  isValidSet(card1, card2, card3) {
    const features = ['number', 'shape', 'color', 'shading'];
    
    return features.every(feature => {
      const values = [card1[feature], card2[feature], card3[feature]];
      // 檢查是否全同或全異
      return (values[0] === values[1] && values[1] === values[2]) ||
             (values[0] !== values[1] && values[1] !== values[2] && values[0] !== values[2]);
    });
  }

  getCardDescription(card) {
    const number = this.featureLabels.number[card.number];
    const color = this.featureLabels.color[card.color];
    const shape = this.featureLabels.shape[card.shape];
    const shading = this.featureLabels.shading[card.shading];
    
    return `${number} ${color} ${shape} (${shading})`;
  }
}

class SetGameApp {
  constructor() {
    this.cameraManager = new CameraManager();
    this.imageProcessor = new ImageProcessor(
      document.getElementById('camera-video'),
      document.getElementById('analysis-canvas')
    );
    this.gameLogic = new SetGameLogic();
    this.isAnalyzing = false;
    this.analysisInterval = null;
    this.currentInterval = 1000; // 默認1秒
    this.lastAnalysisTime = 0;
    
    this.initializeEventListeners();
    this.updateUI();
    this.showWelcomeMessage();
  }

  initializeEventListeners() {
    // 攝像頭控制按鈕
    const startBtn = document.getElementById('start-camera');
    const stopBtn = document.getElementById('stop-camera');
    const switchBtn = document.getElementById('switch-camera');
    const analyzeBtn = document.getElementById('analyze-frame');
    
    startBtn.addEventListener('click', () => this.startCamera());
    stopBtn.addEventListener('click', () => this.stopCamera());
    switchBtn.addEventListener('click', () => this.switchCamera());
    analyzeBtn.addEventListener('click', () => this.analyzeCurrentFrame());
    
    // 設置控制
    document.getElementById('analysis-interval').addEventListener('change', (e) => {
      this.currentInterval = parseInt(e.target.value);
      this.updateAnalysisInterval();
    });
    
    document.getElementById('detection-sensitivity').addEventListener('change', (e) => {
      this.imageProcessor.setSensitivity(e.target.value);
    });
  }

  showWelcomeMessage() {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'permission-request';
    welcomeDiv.innerHTML = `
      <h4>歡迎使用 AI Set 遊戲助理！</h4>
      <p>點擊「啟動攝像頭」開始使用，系統會請求攝像頭權限。</p>
      <p>請確保光線充足，並將 Set 卡片放在攝像頭前方。</p>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(welcomeDiv, container.children[1]);
    
    // 3秒後自動移除歡迎訊息
    setTimeout(() => {
      if (welcomeDiv.parentNode) {
        welcomeDiv.remove();
      }
    }, 8000);
  }

  async startCamera() {
    try {
      this.showStatus('camera-status', '請求權限中...', 'warning');
      this.setButtonState('start-camera', false);
      
      // 顯示權限請求訊息
      this.showPermissionRequest();
      
      await this.cameraManager.startCamera();
      
      this.showStatus('camera-status', '已啟動', 'success');
      this.setButtonState('stop-camera', true);
      this.setButtonState('switch-camera', true);
      this.setButtonState('analyze-frame', true);
      
      // 顯示視頻，隱藏佔位符
      document.querySelector('.video-wrapper').classList.add('active');
      document.getElementById('video-placeholder').classList.add('hidden');
      
      // 移除權限請求訊息
      this.removePermissionRequest();
      
      this.startContinuousAnalysis();
      
      // 顯示成功訊息
      this.showSuccessMessage('攝像頭已成功啟動！系統開始自動分析畫面。');
      
    } catch (error) {
      this.showStatus('camera-status', '啟動失敗', 'error');
      this.setButtonState('start-camera', true);
      this.showError(error.message);
      this.removePermissionRequest();
      console.error('Camera start error:', error);
    }
  }

  showPermissionRequest() {
    this.removePermissionRequest(); // 移除現有的
    
    const permissionDiv = document.createElement('div');
    permissionDiv.className = 'permission-request';
    permissionDiv.id = 'permission-request';
    permissionDiv.innerHTML = `
      <h4>🔐 攝像頭權限請求</h4>
      <p>瀏覽器正在請求攝像頭權限，請點擊「允許」以繼續使用。</p>
      <p><small>如果沒有看到權限對話框，請檢查瀏覽器的地址欄或設定。</small></p>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(permissionDiv, container.children[1]);
  }

  removePermissionRequest() {
    const existingRequest = document.getElementById('permission-request');
    if (existingRequest) {
      existingRequest.remove();
    }
  }

  stopCamera() {
    this.cameraManager.stopCamera();
    this.stopContinuousAnalysis();
    
    this.showStatus('camera-status', '已停止', 'info');
    this.setButtonState('start-camera', true);
    this.setButtonState('stop-camera', false);
    this.setButtonState('switch-camera', false);
    this.setButtonState('analyze-frame', false);
    
    // 隱藏視頻，顯示佔位符
    document.querySelector('.video-wrapper').classList.remove('active');
    document.getElementById('video-placeholder').classList.remove('hidden');
    
    this.clearResults();
  }

  async switchCamera() {
    try {
      this.setButtonState('switch-camera', false);
      this.showStatus('camera-status', '切換中...', 'warning');
      
      await this.cameraManager.switchCamera();
      
      this.showStatus('camera-status', '已啟動', 'success');
      this.setButtonState('switch-camera', true);
    } catch (error) {
      this.showError(`切換攝像頭失敗: ${error.message}`);
      this.setButtonState('switch-camera', true);
      this.showStatus('camera-status', '已啟動', 'success');
    }
  }

  startContinuousAnalysis() {
    if (this.analysisInterval || this.currentInterval === 0) return;
    
    this.analysisInterval = setInterval(() => {
      if (!this.isAnalyzing && this.cameraManager.isActive) {
        this.analyzeCurrentFrame();
      }
    }, this.currentInterval);
  }

  stopContinuousAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  updateAnalysisInterval() {
    this.stopContinuousAnalysis();
    if (this.cameraManager.isActive && this.currentInterval > 0) {
      this.startContinuousAnalysis();
    }
  }

  async analyzeCurrentFrame() {
    if (this.isAnalyzing || !this.cameraManager.isActive) return;
    
    this.isAnalyzing = true;
    const startTime = performance.now();
    
    try {
      // 擷取當前幀
      const imageData = this.imageProcessor.captureFrame();
      
      if (!imageData) {
        throw new Error('無法擷取影像數據，請確認攝像頭正常運作');
      }
      
      // 檢測卡片
      const cards = this.imageProcessor.detectCards(imageData);
      
      // 尋找 Set 組合
      const sets = this.gameLogic.findSets(cards);
      
      // 更新顯示
      this.updateResults(cards, sets);
      this.drawDetectionOverlay(cards, sets);
      
    } catch (error) {
      console.error('分析錯誤:', error);
      this.showError(`分析失敗: ${error.message}`);
    } finally {
      const endTime = performance.now();
      const processTime = Math.round(endTime - startTime);
      this.updateStatus('process-time', `${processTime}ms`);
      this.lastAnalysisTime = processTime;
      this.isAnalyzing = false;
    }
  }

  updateResults(cards, sets) {
    // 更新狀態數字
    this.updateStatus('card-count', cards.length.toString());
    this.updateStatus('set-count', sets.length.toString());
    
    // 顯示檢測到的卡片
    const cardsDiv = document.getElementById('detected-cards');
    if (cards.length === 0) {
      cardsDiv.innerHTML = '<div class="no-results">尚未檢測到任何卡片</div>';
    } else {
      cardsDiv.innerHTML = cards.map((card, index) => `
        <div class="card-info">
          <strong>卡片 ${index + 1}:</strong> ${this.gameLogic.getCardDescription(card)}
          <span style="opacity: 0.7; font-size: 12px; margin-left: 10px;">
            (信心度: ${Math.round(card.confidence * 100)}%)
          </span>
        </div>
      `).join('');
    }
    
    // 顯示找到的 Set 組合
    const setsDiv = document.getElementById('found-sets');
    if (sets.length === 0) {
      setsDiv.innerHTML = '<div class="no-results">尚未找到任何 Set 組合</div>';
    } else {
      setsDiv.innerHTML = sets.map((set, index) => `
        <div class="set-info">
          <strong>Set 組合 ${index + 1}:</strong>
          <span style="opacity: 0.7; font-size: 12px; margin-left: 10px;">
            (信心度: ${Math.round(set.confidence * 100)}%)
          </span>
          <div class="set-cards">
            ${set.cards.map((card, cardIndex) => `
              <div class="set-card-tag">
                ${this.gameLogic.getCardDescription(card)}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  drawDetectionOverlay(cards, sets) {
    const overlay = document.getElementById('detection-overlay');
    const video = document.getElementById('camera-video');
    
    if (!video.videoWidth || !video.videoHeight) return;
    
    const rect = video.getBoundingClientRect();
    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;
    
    // 清除之前的標記
    overlay.innerHTML = '';
    
    // 繪製卡片檢測框
    cards.forEach((card, index) => {
      const box = document.createElement('div');
      box.className = 'detection-box';
      
      const x = card.region.x * scaleX;
      const y = card.region.y * scaleY;
      const width = card.region.width * scaleX;
      const height = card.region.height * scaleY;
      
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
      
      const label = document.createElement('div');
      label.className = 'detection-label';
      label.textContent = `卡片 ${index + 1}`;
      box.appendChild(label);
      
      overlay.appendChild(box);
    });
    
    // 高亮 Set 組合中的卡片
    sets.forEach(set => {
      set.cards.forEach(card => {
        const cardIndex = cards.indexOf(card);
        if (cardIndex >= 0) {
          const boxes = overlay.querySelectorAll('.detection-box');
          if (boxes[cardIndex]) {
            boxes[cardIndex].classList.add('set-highlight');
          }
        }
      });
    });
  }

  updateStatus(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
      element.parentElement.classList.add('updated');
      setTimeout(() => {
        element.parentElement.classList.remove('updated');
      }, 200);
    }
  }

  showStatus(elementId, text, type = 'info') {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text;
      element.className = `status status--${type}`;
    }
  }

  setButtonState(buttonId, enabled) {
    const button = document.getElementById(buttonId);
    if (button) {
      button.disabled = !enabled;
    }
  }

  showError(message) {
    this.removeMessage('error-message');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<strong>錯誤：</strong>${message}`;
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.children[1]);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 8000);
  }

  showSuccessMessage(message) {
    this.removeMessage('success-message');
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.padding = 'var(--space-12)';
    successDiv.style.background = 'rgba(var(--color-success-rgb), 0.1)';
    successDiv.style.border = '1px solid rgba(var(--color-success-rgb), 0.3)';
    successDiv.style.borderRadius = 'var(--radius-base)';
    successDiv.style.color = 'var(--color-success)';
    successDiv.style.marginBottom = 'var(--space-16)';
    successDiv.innerHTML = `<strong>成功：</strong>${message}`;
    
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.children[1]);
    
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 5000);
  }

  removeMessage(className) {
    const existing = document.querySelector(`.${className}`);
    if (existing) {
      existing.remove();
    }
  }

  clearResults() {
    this.updateStatus('card-count', '0');
    this.updateStatus('set-count', '0');
    this.updateStatus('process-time', '0ms');
    
    document.getElementById('detected-cards').innerHTML = '<div class="no-results">尚未檢測到任何卡片</div>';
    document.getElementById('found-sets').innerHTML = '<div class="no-results">尚未找到任何 Set 組合</div>';
    document.getElementById('detection-overlay').innerHTML = '';
  }

  updateUI() {
    // 初始化UI狀態
    this.setButtonState('stop-camera', false);
    this.setButtonState('switch-camera', false);
    this.setButtonState('analyze-frame', false);
  }
}

// 檢查瀏覽器支援
function checkBrowserSupport() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
      <strong>瀏覽器不支援攝像頭功能</strong><br>
      請使用現代瀏覽器（Chrome、Firefox、Safari、Edge）並確保在 HTTPS 環境下運行。<br>
      <small>注意：某些瀏覽器需要安全連線（HTTPS）才能存取攝像頭。</small>
    `;
    document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.container').firstChild);
    return false;
  }
  return true;
}

// 全域變數儲存應用實例
let setGameApp = null;

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
  if (checkBrowserSupport()) {
    setGameApp = new SetGameApp();
    window.setGameApp = setGameApp; // 供調試使用
  }
});

// 處理頁面關閉時清理資源
window.addEventListener('beforeunload', () => {
  if (setGameApp && setGameApp.cameraManager) {
    setGameApp.cameraManager.stopCamera();
  }
});