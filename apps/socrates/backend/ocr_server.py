# =====================================================
# Project Socrates - RapidOCR Server
# Rapid OCR Service - Better Windows compatibility
# =====================================================

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from rapidocr_onnxruntime import RapidOCR
import io
import base64
from PIL import Image
import uvicorn
import numpy as np

app = FastAPI(title="Socrates OCR API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize RapidOCR
print("Initializing RapidOCR...")
try:
    ocr = RapidOCR()
    print("RapidOCR initialized successfully!")
    OCR_AVAILABLE = True
except Exception as e:
    print(f"Warning: RapidOCR initialization failed: {e}")
    print("OCR will return error for requests. Please check RapidOCR installation.")
    OCR_AVAILABLE = False
    ocr = None


def clean_ocr_result(raw_text: str) -> str:
    """Clean and optimize OCR results"""
    if not raw_text:
        return ""

    text = raw_text

    # Remove extra whitespace
    text = text.replace('\t', ' ')

    # Fix spacing around math symbols
    import re
    text = re.sub(r'(\d)\s+([+\-×÷=<>≤≥()])', r'\1\2', text)
    text = re.sub(r'([+\-×÷=<>≤≥()])\s+(\d)', r'\1\2', text)

    # Fix line breaks after punctuation
    text = re.sub(r'([。！？；])\s*', r'\1\n', text)

    # Clean extra blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()


@app.get("/")
async def root():
    return {
        "service": "Socrates OCR API",
        "engine": "RapidOCR",
        "languages": ["Chinese (Simplified/Traditional)", "English"],
        "features": ["Direction detection", "Multi-language support", "High accuracy"]
    }


@app.get("/health")
async def health():
    """健康检查端点"""
    return {
        "status": "ok",
        "ocr_available": OCR_AVAILABLE,
        "engine": "RapidOCR"
    }


@app.post("/ocr")
async def recognize_text(file: UploadFile = File(...)):
    """
    OCR text recognition endpoint

    Upload image file, return recognized text content
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    try:
        # Read image data
        image_data = await file.read()

        # Convert to numpy array for RapidOCR
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image_array = np.array(image)

        # Perform OCR recognition
        result, _ = ocr(image_array)

        # Extract recognized text
        text_lines = []
        if result:
            for line in result:
                if line and len(line) > 1:
                    text_lines.append(line[1])

        # Merge text
        full_text = '\n'.join(text_lines)

        # Clean text
        cleaned_text = clean_ocr_result(full_text)

        return {
            "success": True,
            "text": cleaned_text,
            "raw_text": full_text,
            "line_count": len(text_lines),
            "engine": "RapidOCR"
        }

    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR recognition failed: {str(e)}")


@app.post("/ocr-base64")
async def recognize_text_base64(data: dict):
    """
    OCR text recognition endpoint (Base64 format)

    Receive base64 encoded image data, return recognized text content
    """
    if "image" not in data:
        raise HTTPException(status_code=400, detail="Missing image parameter")

    if not OCR_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="OCR service unavailable. RapidOCR initialization failed. Please restart the server or check installation."
        )

    try:
        # Decode base64
        image_data = base64.b64decode(data["image"])

        # Convert to numpy array for RapidOCR
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        image_array = np.array(image)

        # Perform OCR recognition
        result, _ = ocr(image_array)

        # Extract recognized text
        text_lines = []
        if result:
            for line in result:
                if line and len(line) > 1:
                    text_lines.append(line[1])

        # Merge text
        full_text = '\n'.join(text_lines)
        cleaned_text = clean_ocr_result(full_text)

        return {
            "success": True,
            "text": cleaned_text,
            "raw_text": full_text,
            "line_count": len(text_lines),
            "engine": "RapidOCR"
        }

    except Exception as e:
        print(f"OCR Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"OCR recognition failed: {str(e)}. Please ensure the image is clear and contains text."
        )


if __name__ == "__main__":
    import sys
    import io as io_module
    # Set UTF-8 encoding for Windows console
    if sys.platform == "win32":
        sys.stdout = io_module.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io_module.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

    print("=" * 50)
    print("Socrates OCR Server starting...")
    print("Address: http://localhost:8000")
    print("Engine: RapidOCR (Chinese optimized)")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8000)
