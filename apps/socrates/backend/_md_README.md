# Socrates OCR Backend

PaddleOCR 高精度中文识别服务。

## 快速开始

### 1. 安装依赖

```bash
cd backend
pip install paddlepaddle paddleocr fastapi uvicorn python-multipart
```

### 2. 启动服务

**Windows:**
```bash
start_ocr_server.bat
```

**Mac/Linux:**
```bash
python ocr_server.py
```

服务启动后会在 http://localhost:8000 运行

## API 接口

### POST /ocr-base64

使用 base64 编码的图片进行 OCR 识别

**请求:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**响应:**
```json
{
  "success": true,
  "text": "识别的文字内容",
  "raw_text": "原始识别文字",
  "line_count": 10,
  "engine": "PaddleOCR"
}
```

### GET /

获取服务信息

**响应:**
```json
{
  "service": "Socrates OCR API",
  "engine": "PaddleOCR",
  "languages": ["中文（简体/繁体）", "英文"],
  "features": ["方向检测", "多语言支持", "高准确率"]
}
```

## PaddleOCR 优势

- **高精度中文识别**: 专门为中文优化的深度学习模型
- **方向检测**: 自动识别旋转/倾斜的文字
- **多语言支持**: 同时支持中文（简体/繁体）和英文
- **数学符号**: 支持常见数学符号识别
- **准确率**: 中文识别准确率远超 Tesseract

## 技术栈

- **PaddleOCR**: 百度开源的 OCR 工具包
- **PaddlePaddle**: 深度学习框架
- **FastAPI**: 高性能 Web 框架
- **Uvicorn**: ASGI 服务器

## 前端集成

前端会自动连接 `http://localhost:8000/ocr-base64` 进行识别。

如果后端服务未启动，前端会自动回退到 Tesseract.js（客户端 OCR）。

## 故障排查

### 端口冲突

如果 8000 端口被占用，修改 `ocr_server.py` 中的端口号：

```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # 改为 8001
```

同时修改前端的 `OCRResult.tsx` 中的 `OCR_API_URL`。

### 依赖安装失败

如果安装 paddlepaddle 失败，尝试：

```bash
# CPU 版本
pip install paddlepaddle -i https://mirror.baidu.com/pypi/simple

# 或使用清华镜像
pip install paddlepaddle -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 首次运行慢

首次运行时 PaddleOCR 会下载模型文件（约 10MB），需要等待。
模型会缓存到本地，后续运行会很快。

## 开发说明

### 添加新的语言支持

修改 `ocr_server.py` 中的 PaddleOCR 初始化参数：

```python
ocr = PaddleOCR(
    use_angle_cls=True,
    lang='ch',  # 'ch'=中文, 'en'=英文, 'japan'=日文等
    use_gpu=False
)
```

### 自定义文本清理

修改 `clean_ocr_result()` 函数来添加自定义的文本后处理逻辑。
