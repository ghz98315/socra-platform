// =====================================================
// Essay History - 历史记录组件
// =====================================================

import React, { useState, useEffect } from 'react';
import { X, Clock, Trash2, ChevronRight, Loader2, FileText, Calendar } from 'lucide-react';
import { getEssayHistory, deleteEssay, EssayRecord } from '../lib/essay-history';

interface EssayHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEssay: (record: EssayRecord) => void;
}

const EssayHistory: React.FC<EssayHistoryProps> = ({ isOpen, onClose, onSelectEssay }) => {
  const [records, setRecords] = useState<EssayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getEssayHistory(50);
    setRecords(data);
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('确定要删除这条批改记录吗？')) return;

    setDeletingId(id);
    const success = await deleteEssay(id);
    if (success) {
      setRecords(records.filter(r => r.id !== id));
    }
    setDeletingId(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (days === 1) {
      return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  };

  const getGradeLabel = (grade: string) => {
    const gradeMap: Record<string, string> = {
      '小学一年级': '小一', '小学二年级': '小二', '小学三年级': '小三',
      '小学四年级': '小四', '小学五年级': '小五', '小学六年级': '小六',
      '初中一年级': '初一', '初中二年级': '初二', '初中三年级': '初三',
    };
    return gradeMap[grade] || grade;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-warm-100 p-2 rounded-xl">
              <Clock className="text-warm-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">批改历史</h2>
              <p className="text-sm text-gray-500">共 {records.length} 条记录</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-warm-500 mb-3" size={32} />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <FileText className="text-gray-400" size={40} />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">暂无批改记录</h3>
              <p className="text-gray-500 text-sm">批改的作文将自动保存在这里</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  onClick={() => onSelectEssay(record)}
                  className="group bg-gray-50 hover:bg-warm-50 rounded-xl p-4 cursor-pointer transition-all border border-transparent hover:border-warm-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* 标题和年级 */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-warm-100 text-warm-700 text-xs font-medium rounded-full">
                          {getGradeLabel(record.grade)}
                        </span>
                        <h3 className="font-medium text-gray-800 truncate">
                          {record.title || '无标题作文'}
                        </h3>
                      </div>

                      {/* 内容预览 */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {record.content.substring(0, 100)}...
                      </p>

                      {/* 时间和图片数 */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(record.created_at)}
                        </span>
                        <span>{record.images?.length || 0} 张图片</span>
                        <span>
                          {record.analysis?.highlights?.length || 0} 个闪光点
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDelete(e, record.id)}
                        disabled={deletingId === record.id}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="删除"
                      >
                        {deletingId === record.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                      <ChevronRight className="text-gray-300" size={20} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            点击记录可查看详细批改结果
          </p>
        </div>
      </div>
    </div>
  );
};

export default EssayHistory;
