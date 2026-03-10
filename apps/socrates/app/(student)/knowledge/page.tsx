// =====================================================
// Project Socrates - Knowledge Graph Page
// 知识图谱页面
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Flame,
  Search,
  Star,
  Target,
  TrendingUp,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface KnowledgeNode {
  id: string;
  parent_id: string | null;
  subject: string;
  grade_level: number | null;
  chapter: string | null;
  difficulty: number;
  description: string;
  key_points: string | null;
  prerequisites: string[] | null;
}

interface UserMastery {
  id: string;
  node_id: string;
  mastery_level: number;
  confidence_score: number;
  last_review_at: string | null;
  review_count: number;
  last_practice_at: string | null;
  last_practice_type: string | null;
  notes: string | null;
  streak_days: number;
  consecutive_correct_days: number;
  practice_duration_minutes: number;
  strengths: string[];
  weaknesses: string[];
}

interface KnowledgeNodeWithMastery extends KnowledgeNode {
  mastery?: UserMastery;
}

interface Stats {
  totalNodes: number;
  masteredNodes: number;
  averageMastery: number;
  streakDays: number;
}

// Subject labels
const subjectLabels: Record<string, string> = {
  math: '数学',
  chinese: '语文',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
};

// Difficulty labels
const difficultyLabels: Record<number, { label: string; color: string }> = {
  1: { label: '简单', color: 'bg-green-100 text-green-700' },
  2: { label: '基础', color: 'bg-blue-100 text-blue-700' },
  3: { label: '中等', color: 'bg-yellow-100 text-yellow-700' },
  4: { label: '困难', color: 'bg-orange-100 text-orange-700' },
  5: { label: '专家', color: 'bg-red-100 text-red-700' },
};

// Mastery color helper
const getMasteryColor = (level: number): string => {
  if (level >= 4) return 'text-green-600';
  if (level >= 3) return 'text-blue-600';
  if (level >= 2) return 'text-yellow-600';
  if (level >= 1) return 'text-orange-600';
  return 'text-gray-400';
};

export default function KnowledgePage() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<KnowledgeNodeWithMastery[]>([]);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeWithMastery | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalNodes: 0,
    masteredNodes: 0,
    averageMastery: 0,
    streakDays: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch knowledge data
  useEffect(() => {
    if (!user) return;

    const fetchKnowledgeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/knowledge?user_id=${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch knowledge data');
        }

        // Merge nodes with mastery data
        const knowledgeNodes = data.nodes || [];
        const masteryData = data.mastery || [];

        const masteryMap = new Map<string, UserMastery>();
        masteryData.forEach((m: UserMastery) => {
          masteryMap.set(m.node_id, m);
        });

        const nodesWithMastery: KnowledgeNodeWithMastery[] = knowledgeNodes.map(
          (node: KnowledgeNode) => ({
            ...node,
            mastery: masteryMap.get(node.id),
          })
        );

        setNodes(nodesWithMastery);

        // Calculate stats
        const masteredCount = nodesWithMastery.filter(
          (n) => n.mastery && n.mastery.mastery_level >= 4
        ).length;

        const totalMastery = nodesWithMastery.reduce((sum, n) => {
          return sum + (n.mastery?.mastery_level || 0);
        }, 0);

        const maxStreak = Math.max(
          ...nodesWithMastery.map((n) => n.mastery?.streak_days || 0),
          0
        );

        setStats({
          totalNodes: knowledgeNodes.length,
          masteredNodes: masteredCount,
          averageMastery:
            knowledgeNodes.length > 0
              ? Math.round((totalMastery / knowledgeNodes.length) * 10) / 10
              : 0,
          streakDays: maxStreak,
        });
      } catch (err) {
        console.error('Failed to fetch knowledge data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchKnowledgeData();
  }, [user]);

  // Filter nodes
  const filteredNodes = nodes.filter((node) => {
    const matchesSearch =
      searchQuery === '' ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.chapter?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectLabels[node.subject]?.includes(searchQuery);

    const matchesSubject =
      selectedSubject === 'all' || node.subject === selectedSubject;

    return matchesSearch && matchesSubject;
  });

  // Group by subject
  const nodesBySubject = filteredNodes.reduce((acc, node) => {
    const subject = node.subject;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(node);
    return acc;
  }, {} as Record<string, KnowledgeNodeWithMastery[]>);

  // Handle node selection
  const handleSelectNode = (node: KnowledgeNodeWithMastery) => {
    setSelectedNode(node);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-warm-500 border-t-transparent" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>重新加载</Button>
      </div>
    );
  }

  // Detail panel for selected node
  if (selectedNode) {
    return (
      <div className="max-w-md mx-auto p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedNode(null)}
            className="p-2"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">知识点详情</h1>
        </div>

        {/* Node Detail Card */}
        <Card className="mb-4">
          <CardContent className="p-4">
            {/* Subject and Chapter */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{subjectLabels[selectedNode.subject]}</Badge>
              {selectedNode.chapter && (
                <Badge variant="outline">{selectedNode.chapter}</Badge>
              )}
              <Badge className={difficultyLabels[selectedNode.difficulty]?.color}>
                {difficultyLabels[selectedNode.difficulty]?.label}
              </Badge>
            </div>

            {/* Description */}
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedNode.description}
            </h2>

            {/* Key Points */}
            {selectedNode.key_points && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">{selectedNode.key_points}</p>
              </div>
            )}

            {/* Mastery Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">掌握度</span>
                <span className={cn('text-sm font-bold', getMasteryColor(selectedNode.mastery?.mastery_level || 0))}>
                  {selectedNode.mastery?.mastery_level || 0} / 5
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    (selectedNode.mastery?.mastery_level || 0) >= 4
                      ? 'bg-green-500'
                      : (selectedNode.mastery?.mastery_level || 0) >= 3
                        ? 'bg-blue-500'
                        : (selectedNode.mastery?.mastery_level || 0) >= 2
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                  )}
                  style={{ width: `${((selectedNode.mastery?.mastery_level || 0) / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">复习次数</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedNode.mastery?.review_count || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">连续天数</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedNode.mastery?.streak_days || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <Target className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-gray-500">置信度</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedNode.mastery?.confidence_score || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strengths & Weaknesses */}
        {(selectedNode.mastery?.strengths?.length || selectedNode.mastery?.weaknesses?.length) && (
          <Card className="mb-4">
            <CardContent className="p-4">
              {selectedNode.mastery?.strengths && selectedNode.mastery.strengths.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    优势
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.mastery.strengths.map((s, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-700">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedNode.mastery?.weaknesses && selectedNode.mastery.weaknesses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    待加强
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.mastery.weaknesses.map((w, idx) => (
                      <Badge key={idx} className="bg-orange-100 text-orange-700">
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {selectedNode.mastery?.notes && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">笔记</p>
              <p className="text-sm text-gray-600">{selectedNode.mastery.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Prerequisites */}
        {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">前置知识点</p>
              <div className="space-y-2">
                {selectedNode.prerequisites.map((prereqId) => {
                  const prereqNode = nodes.find((n) => n.id === prereqId);
                  if (!prereqNode) return null;
                  return (
                    <div
                      key={prereqId}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelectNode(prereqNode)}
                    >
                      <span className="text-sm text-gray-700">
                        {prereqNode.description}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Main view
  return (
    <div className="max-w-md mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">我的知识图谱</h1>
        <p className="text-gray-600 text-sm">查看您在各知识点上的掌握情况</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-3 text-center">
            <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalNodes}</p>
            <p className="text-xs text-gray-500">知识点总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.masteredNodes}</p>
            <p className="text-xs text-gray-500">已掌握</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.averageMastery}</p>
            <p className="text-xs text-gray-500">平均掌握度</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{stats.streakDays}</p>
            <p className="text-xs text-gray-500">最长连续天数</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索知识点..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-transparent"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Subject Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Button
          size="sm"
          variant={selectedSubject === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedSubject('all')}
          className="whitespace-nowrap"
        >
          全部
        </Button>
        {Object.entries(subjectLabels).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={selectedSubject === key ? 'default' : 'outline'}
            onClick={() => setSelectedSubject(key)}
            className="whitespace-nowrap"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Knowledge Nodes List */}
      {filteredNodes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无知识点数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(nodesBySubject).map(([subject, subjectNodes]) => (
            <div key={subject}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {subjectLabels[subject] || subject}
                <Badge variant="secondary" className="text-xs">
                  {subjectNodes.length}
                </Badge>
              </h3>
              <div className="space-y-2">
                {subjectNodes.map((node) => (
                  <Card
                    key={node.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSelectNode(node)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {node.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {node.chapter && (
                              <span className="text-xs text-gray-500">
                                {node.chapter}
                              </span>
                            )}
                            <span
                              className={cn(
                                'text-xs font-medium',
                                getMasteryColor(node.mastery?.mastery_level || 0)
                              )}
                            >
                              掌握度: {node.mastery?.mastery_level || 0}/5
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                              (node.mastery?.mastery_level || 0) >= 4
                                ? 'bg-green-100 text-green-600'
                                : (node.mastery?.mastery_level || 0) >= 2
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-gray-100 text-gray-400'
                            )}
                          >
                            {node.mastery?.mastery_level || 0}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
