# Socrates 项目 - OCR 识别问题解决方案

## 问题分析

根据 reco.pdf，使用 Tesseract.js 进行中文 OCR 识别存在严重问题：
- 识别结果产生大量错误字符（乱码）
- 无法正确识别中文字符和数学符号
- 期望结果：`已知：如图，在△ABC中，AB=AC，点D在AC上，且AD=BD=BC，求∠A的度数。`
- 实际结果：错误的字符组合

## 解决方案

使用 **PaddleOCR**（百度开源）替代 Tesseract.js，它是专门为中文优化的 OCR 引擎。

### PaddleOCR vs Tesseract 对比

| 特性 | PaddleOCR | Tesseract.js |
|------|-----------|--------------|
| 中文识别准确率 | 95%+ | ~60% |
| 数学符号支持 | 优秀 | 差 |
| 识别速度 | 快 | 慢 |
| 方向检测 | 内置 | 需额外配置 |
| 文件大小 | 10MB 模型 | 20MB+ 语言包 |

## 已完成的工作

### 1. 后端服务 (`backend/ocr_server.py`)

创建了一个基于 FastAPI 的 PaddleOCR 服务：
- 支持中文（简体/繁体）和英文识别
- 自动方向检测
- 文本后处理和清理
- RESTful API 接口

### 2. 前端更新 (`components/OCRResult.tsx`)

- 首先尝试连接 PaddleOCR 后端服务
- 如果后端不可用，自动回退到 Tesseract.js
- 显示当前使用的 OCR 引擎
- 改进的用户界面和状态提示

### 3. 启动脚本

- `start_ocr_server.bat` - Windows 一键启动脚本

## 使用步骤

### 第一步：安装 Python 依赖

```bash
cd backend
pip install paddlepaddle paddleocr fastapi uvicorn python-multipart
```

**注意**：首次安装需要下载约 100MB 的文件，请耐心等待。

如果下载太慢，可以使用国内镜像：

```bash
pip install paddlepaddle -i https://mirror.baidu.com/pypi/simple
pip install paddleocr fastapi uvicorn python-multipart
```

### 第二步：启动 OCR 服务

**Windows:**
```bash
start_ocr_server.bat
```

**Mac/Linux:**
```bash
cd backend
python ocr_server.py
```

看到以下输出表示启动成功：
```
==================================================
🚀 Socrates OCR Server 启动中...
📍 地址: http://localhost:8000
🔧 引擎: PaddleOCR (中文优化)
==================================================
正在初始化 PaddleOCR...
PaddleOCR 初始化完成！
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 第三步：启动前端服务

```bash
cd socrates-app
npm run dev
```

前端运行在 http://localhost:3002

### 第四步：测试 OCR

1. 打开 http://localhost:3002/workbench
2. 上传一张包含中文文字的图片
3. 查看 "识别结果" 区域，应该显示 "PaddleOCR" 标签
4. 识别的文字应该准确无误

## API 文档

### POST /ocr-base64

```json
{
  "image": "base64编码的图片数据"
}
```

响应：
```json
{
  "success": true,
  "text": "识别的文字",
  "raw_text": "原始识别文字",
  "line_count": 10,
  "engine": "PaddleOCR"
}
```

## 常见问题

### Q: 端口 8000 被占用怎么办？

修改 `ocr_server.py` 的最后一行：
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # 改为其他端口
```

同时修改 `OCRResult.tsx`：
```typescript
const OCR_API_URL = 'http://localhost:8001/ocr-base64';
```

### Q: PaddleOCR 服务启动后前端仍显示备用方案？

1. 检查后端是否正常运行：访问 http://localhost:8000
2. 检查浏览器控制台是否有 CORS 错误
3. 确认前后端端口配置一致

### Q: 识别速度慢怎么办？

首次使用时 PaddleOCR 会下载模型文件（约 10MB），之后会缓存到本地，速度会明显提升。

### Q: 识别结果还是不准确？

1. 确保图片清晰、文字可读
2. 图片尺寸建议至少 1000px
3. 裁剪掉多余背景，只保留文字区域
4. 避免阴影、反光等干扰

## 文件结构

```
socrates-app/
├── backend/
│   ├── ocr_server.py      # PaddleOCR 服务
│   ├── start_ocr_server.bat # 启动脚本
│   └── README.md          # 后端文档
├── components/
│   └── OCRResult.tsx      # OCR 前端组件（已更新）
└── app/
    └── (student)/workbench/
        └── page.tsx        # 工作台页面
```

## 技术栈

**后端:**
- PaddleOCR - 百度开源 OCR
- PaddlePaddle - 深度学习框架
- FastAPI - Web 框架
- Uvicorn - ASGI 服务器

**前端:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS

## 下一步

如果需要更高级的功能，可以考虑：
1. 添加 GPU 支持（use_gpu=True）
2. 集成其他 OCR 引擎作为备选
3. 添加图片预处理功能
4. 实现批量 OCR 处理
