@echo off
REM =====================================================
REM Project Socrates - PaddleOCR Server 启动脚本
REM =====================================================

echo ========================================
echo   Socrates OCR Server 启动中...
echo ========================================
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo Python 版本:
python --version
echo.

REM 进入后端目录
cd /d "%~dp0"

echo 正在启动 PaddleOCR 服务...
echo 服务地址: http://localhost:8000
echo.
echo 按 Ctrl+C 停止服务
echo.

REM 启动 OCR 服务
python ocr_server.py

pause
