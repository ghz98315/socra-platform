// =====================================================
// Project Socrates - PDF Export Component
// Error Question PDF Document
// =====================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// 注册中文字体 - 使用系统内置的 Noto Sans SC 或其他支持中文的字体
// 注意：生产环境需要将字体文件放在 public 目录下
Font.register({
  family: 'NotoSansSC',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v35/k3kXo84MPvpLmixcA63OEALhLOCT-xWtmGJX.woff2',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v35/k3kXo84MPvpLmixcA63OEALhLOCT-xWtmGJX.woff2',
      fontWeight: 500,
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanssc/v35/k3kXo84MPvpLmixcA63OEALhLOCT-xWtmGJX.woff2',
      fontWeight: 700,
    },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansSC',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#FF9500',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#FF9500',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  date: {
    fontSize: 10,
    color: '#86868B',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#86868B',
    marginBottom: 25,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  labelText: {
    fontSize: 10,
    color: '#86868B',
    marginBottom: 4,
  },
  contentText: {
    fontSize: 11,
    color: '#1D1D1F',
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 15,
  },
  tag: {
    fontSize: 9,
    color: '#FF9500',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficulty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 15,
  },
  star: {
    fontSize: 12,
    color: '#FF9500',
  },
  conversationItem: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#E5F1FF',
  },
  aiMessage: {
    backgroundColor: '#F5F5F7',
  },
  messageLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userLabel: {
    color: '#007AFF',
  },
  aiLabel: {
    color: '#FF9500',
  },
  messageText: {
    fontSize: 10,
    color: '#1D1D1F',
  },
  imageContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  image: {
    width: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    borderRadius: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 9,
    color: '#86868B',
  },
  pageNumber: {
    fontSize: 9,
    color: '#86868B',
  },
  metadata: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  metadataItem: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 9,
    color: '#86868B',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1D1D1F',
  },
});

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ErrorQuestionData {
  // Basic info
  subject: string;
  createdAt: string;
  studentName?: string;

  // OCR data
  ocrText?: string;
  imageUrl?: string;

  // Analysis
  conceptTags?: string[];
  difficultyRating?: number;
  subjectCategory?: string;

  // Conversation
  messages?: Message[];

  // Review
  reviewStage?: number;
  nextReviewDate?: string;
}

interface ErrorQuestionPDFProps {
  data: ErrorQuestionData;
}

// Subject labels
const subjectLabels: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  other: '其他',
};

// Review stage labels
const reviewStages = ['新学', '1天后', '3天后', '7天后', '30天后'];

export function ErrorQuestionPDF({ data }: ErrorQuestionPDFProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>S</Text>
            </View>
            <Text style={styles.logoText}>Socrates</Text>
          </View>
          <Text style={styles.date}>{formatDate(data.createdAt)}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>错题记录</Text>
        <Text style={styles.subtitle}>
          {data.studentName ? `${data.studentName} · ` : ''}
          {subjectLabels[data.subject] || data.subject}
        </Text>

        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>科目</Text>
            <Text style={styles.metadataValue}>{subjectLabels[data.subject] || data.subject}</Text>
          </View>
          {data.difficultyRating && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>难度</Text>
              <Text style={styles.metadataValue}>
                {'★'.repeat(data.difficultyRating)}{'☆'.repeat(5 - data.difficultyRating)}
              </Text>
            </View>
          )}
          {data.reviewStage !== undefined && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>复习阶段</Text>
              <Text style={styles.metadataValue}>{reviewStages[data.reviewStage] || '未设置'}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {data.conceptTags && data.conceptTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>知识点标签</Text>
            <View style={styles.tagContainer}>
              {data.conceptTags.map((tag, index) => (
                <Text key={index} style={styles.tag}>{tag}</Text>
              ))}
            </View>
          </View>
        )}

        {/* OCR Text */}
        {data.ocrText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>题目内容</Text>
            <Text style={styles.contentText}>{data.ocrText}</Text>
          </View>
        )}

        {/* Conversation */}
        {data.messages && data.messages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>学习对话记录</Text>
            {data.messages.slice(0, 10).map((message, index) => (
              <View
                key={index}
                style={[
                  styles.conversationItem,
                  message.role === 'user' ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageLabel,
                    message.role === 'user' ? styles.userLabel : styles.aiLabel,
                  ]}
                >
                  {message.role === 'user' ? '我的问题' : 'AI 苏格拉底'}
                </Text>
                <Text style={styles.messageText}>
                  {message.content.length > 500
                    ? message.content.substring(0, 500) + '...'
                    : message.content}
                </Text>
              </View>
            ))}
            {data.messages.length > 10 && (
              <Text style={{ fontSize: 9, color: '#86868B', marginTop: 8 }}>
                ... 还有 {data.messages.length - 10} 条对话记录
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            由 Socrates AI 学习助手生成
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `第 ${pageNumber} 页 / 共 ${totalPages} 页`}
          />
        </View>
      </Page>
    </Document>
  );
}

// Export function to generate PDF blob
export async function generateErrorQuestionPDF(data: ErrorQuestionData): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');
  const doc = <ErrorQuestionPDF data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

// Export function to download PDF
export async function downloadErrorQuestionPDF(data: ErrorQuestionData, filename?: string): Promise<void> {
  const blob = await generateErrorQuestionPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `错题_${data.subject}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
