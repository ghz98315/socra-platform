// =====================================================
// FileUpload - 文件上传组件
// =====================================================

import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Camera, Layers, Users, Sparkles } from 'lucide-react';
import { GradeLevel } from '../types';

interface FileUploadProps {
  onFileSelect: (files: string[], previews: string[], grade: GradeLevel) => void;
}

const PRIMARY_GRADES: GradeLevel[] = [
  '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级'
];

const MIDDLE_GRADES: GradeLevel[] = [
  '初中一年级', '初中二年级', '初中三年级'
];

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('小学三年级');
  const [usageCount, setUsageCount] = useState(1888);

  useEffect(() => {
    const storedCount = localStorage.getItem('ai_essay_usage_count');
    if (storedCount) {
      setUsageCount(parseInt(storedCount, 10));
    } else {
      setUsageCount(1888);
      localStorage.setItem('ai_essay_usage_count', '1888');
    }
  }, []);

  const incrementUsage = () => {
    const newCount = usageCount + 1;
    setUsageCount(newCount);
    localStorage.setItem('ai_essay_usage_count', newCount.toString());
  };

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('请上传图片文件 (JPG, PNG)');
      return;
    }

    incrementUsage();

    const promises = imageFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(base64List => {
      onFileSelect(base64List, base64List, selectedGrade);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">

      {/* Usage Stats Banner */}
      <div className="mb-8 flex justify-center">
        <div className="bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full border border-warm-200 shadow-sm flex items-center gap-2 text-warm-700 text-sm md:text-base animate-bounce-slow">
          <Users size={18} className="text-warm-500" />
          <span>已累计为 <span className="font-bold text-warm-600 font-mono text-lg">{usageCount.toLocaleString()}</span> 位小朋友提供作文辅导</span>
          <Sparkles size={16} className="text-yellow-400" />
        </div>
      </div>

      {/* Grade Selection */}
      <div className="mb-6 text-center">
        <label className="block text-warm-700 font-medium mb-4 text-lg">
          请选择年级，AI老师会因材施教哦
        </label>

        <div className="space-y-3">
          {/* Primary School Row */}
          <div className="flex flex-wrap justify-center gap-2">
            {PRIMARY_GRADES.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                  selectedGrade === grade
                    ? 'bg-warm-500 text-white shadow-md scale-105 font-bold ring-2 ring-warm-200 ring-offset-1'
                    : 'bg-white text-warm-600 border border-warm-200 hover:bg-warm-50'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>

          {/* Middle School Row */}
          <div className="flex flex-wrap justify-center gap-2">
            {MIDDLE_GRADES.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                  selectedGrade === grade
                    ? 'bg-warm-500 text-white shadow-md scale-105 font-bold ring-2 ring-warm-200 ring-offset-1'
                    : 'bg-white text-warm-600 border border-warm-200 hover:bg-warm-50'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`
          relative group cursor-pointer
          border-2 border-dashed rounded-3xl p-10 transition-all duration-300
          flex flex-col items-center justify-center text-center min-h-[300px]
          ${isDragging
            ? 'border-warm-500 bg-warm-100 scale-[1.02]'
            : 'border-warm-300 bg-white hover:border-warm-400 hover:bg-warm-50 shadow-sm hover:shadow-md'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleUploadClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        <input
          type="file"
          ref={cameraInputRef}
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />

        <div className="w-24 h-24 bg-warm-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 relative">
          <div className="absolute inset-0 rounded-full bg-warm-200 animate-ping opacity-20"></div>
          {isDragging ? (
            <Layers className="w-12 h-12 text-warm-500 animate-bounce" />
          ) : (
            <Upload className="w-12 h-12 text-warm-500" />
          )}
        </div>

        <h3 className="text-2xl font-bold text-warm-800 mb-3">
          点击或拖拽上传作文图片
        </h3>

        <p className="text-warm-600 mb-6 max-w-xs mx-auto leading-relaxed text-sm md:text-base">
          ✨ 支持多张图片批量上传<br/>会自动识别并按顺序拼合哦
        </p>

        <div className="flex gap-4 justify-center flex-wrap relative z-10">
          <button
            onClick={handleUploadClick}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white text-warm-600 text-sm font-medium border border-warm-200 hover:bg-warm-50 hover:text-warm-700 shadow-sm transition-colors"
          >
            <ImageIcon size={16} className="mr-1.5" /> 相册上传
          </button>
          <button
            onClick={handleCameraClick}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white text-warm-600 text-sm font-medium border border-warm-200 hover:bg-warm-50 hover:text-warm-700 shadow-sm transition-colors"
          >
            <Camera size={16} className="mr-1.5" /> 拍照上传
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
