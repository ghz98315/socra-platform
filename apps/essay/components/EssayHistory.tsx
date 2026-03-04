// =====================================================
// Essay History - 历史记录组件
// =====================================================

import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Trash2, ChevronRight, Loader2, FileText, Calendar, Search, ChevronLeft, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { getEssayHistory, deleteEssay, EssayRecord } from '../lib/essay-history';

interface EssayHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEssay: (record: EssayRecord) => void;
}

const ITEMS_PER_PAGE = 10;

const EssayHistory: React.FC<EssayHistoryProps> = ({ isOpen, onClose, onSelectEssay }) => {
  const [records, setRecords] = useState<EssayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  // 重置分页当搜索词变化时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getEssayHistory(100);
    setRecords(data);
    setLoading(false);
  };

  // 过滤和搜索
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;

    const query = searchQuery.toLowerCase();
    return records.filter(record => {
      const titleMatch = record.title?.toLowerCase().includes(query);
      const contentMatch = record.content?.toLowerCase().includes(query);
      const gradeMatch = record.grade?.toLowerCase().includes(query);
      return titleMatch || contentMatch || gradeMatch;
    });
  }, [records, searchQuery]);

  // 分页
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

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
              <p className="text-sm text-gray-500">
                共 {filteredRecords.length} 条记录
                {searchQuery && records.length !== filteredRecords.length && (
                  <span className="text-warm-500"> (筛选自 {records.length} 条)</span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索标题、内容或年级..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-warm-400 focus:ring-2 focus:ring-warm-100 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-warm-500 mb-3" size={32} />
              <p className="text-gray-500">加载中...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full mb-4">
                <FileText className="text-gray-400" size={40} />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {searchQuery ? '未找到匹配的记录' : '暂无批改记录'}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchQuery ? '请尝试其他搜索词' : '批改的作文将自动保存在这里'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedRecords.map((record) => (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              第 {currentPage} / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-warm-500 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}

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
