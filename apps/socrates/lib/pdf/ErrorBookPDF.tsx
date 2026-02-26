// =====================================================
// Project Socrates - Error Book PDF Export
// 错题本批量导出功能
// =====================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// 注册中文字体
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

// Create styles for error book
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
    marginBottom: 25,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#86868B',
    marginBottom: 20,
  },
  summaryBox: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  summaryLabel: {
    fontSize: 9,
    color: '#86868B',
    marginTop: 2,
  },
  errorItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  errorSubject: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D1D1F',
  },
  errorDate: {
    fontSize: 9,
    color: '#86868B',
  },
  errorContent: {
    fontSize: 10,
    color: '#1D1D1F',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    fontSize: 8,
    color: '#007AFF',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  difficultyStar: {
    fontSize: 10,
    color: '#FF9500',
  },
  difficultyEmptyStar: {
    fontSize: 10,
    color: '#E5E5E5',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 15,
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
  noErrors: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noErrorsText: {
    fontSize: 14,
    color: '#86868B',
  },
});

interface ErrorItem {
  subject: string;
  extractedText: string;
  difficultyRating?: number | null;
  conceptTags?: string[] | null;
  createdAt: string;
  imageUrl?: string | null;
}

interface ErrorBookData {
  studentName?: string;
  errors: ErrorItem[];
}

const subjectLabels: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const subjectColors: Record<string, string> = {
  math: '#007AFF',
  physics: '#AF52DE',
  chemistry: '#34C759',
};

export function ErrorBookPDF({ data }: { data: ErrorBookData }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Group errors by subject
  const groupedErrors = data.errors.reduce((acc, err) => {
    const subject = err.subject || 'other';
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(err);
    return acc;
  }, {} as Record<string, ErrorItem[]>);

  // Calculate stats
  const totalErrors = data.errors.length;
  const avgDifficulty = data.errors.reduce((sum, e) => sum + (e.difficultyRating || 3), 0) / (totalErrors || 1);
  const allTags = data.errors.flatMap(e => e.conceptTags || []);
  const uniqueTags = [...new Set(allTags)];

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
          <Text style={styles.date}>{formatFullDate(new Date().toISOString())}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>错题本</Text>
        <Text style={styles.subtitle}>
          {data.studentName ? `${data.studentName} 的错题整理` : '我的错题整理'}
        </Text>

        {data.errors.length === 0 ? (
          <View style={styles.noErrors}>
            <Text style={styles.noErrorsText}>暂无错题记录</Text>
          </View>
        ) : (
          <>
            {/* Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{totalErrors}</Text>
                <Text style={styles.summaryLabel}>错题总数</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{avgDifficulty.toFixed(1)}</Text>
                <Text style={styles.summaryLabel}>平均难度</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{Object.keys(groupedErrors).length}</Text>
                <Text style={styles.summaryLabel}>涉及科目</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{uniqueTags.length}</Text>
                <Text style={styles.summaryLabel}>知识点数</Text>
              </View>
            </View>

            {/* Errors by Subject */}
            {Object.entries(groupedErrors).map(([subject, errors]) => (
              <View key={subject}>
                {/* Subject Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 10 }}>
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: subjectColors[subject] || '#86868B',
                    marginRight: 8,
                  }} />
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1D1D1F' }}>
                    {subjectLabels[subject] || subject}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#86868B', marginLeft: 8 }}>
                    ({errors.length}题)
                  </Text>
                </View>

                {/* Error Items */}
                {errors.map((error, index) => (
                  <View key={index} style={styles.errorItem}>
                    <View style={styles.errorHeader}>
                      <Text style={styles.errorSubject}>
                        第 {index + 1} 题
                      </Text>
                      <Text style={styles.errorDate}>{formatDate(error.createdAt)}</Text>
                    </View>

                    {/* Difficulty */}
                    {error.difficultyRating && (
                      <View style={styles.difficultyRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Text
                            key={star}
                            style={star <= error.difficultyRating! ? styles.difficultyStar : styles.difficultyEmptyStar}
                          >
                            ★
                          </Text>
                        ))}
                        <Text style={{ fontSize: 9, color: '#86868B', marginLeft: 5 }}>
                          难度 {error.difficultyRating}/5
                        </Text>
                      </View>
                    )}

                    {/* Content */}
                    <View style={styles.errorContent}>
                      <Text style={{ fontSize: 10, color: '#1D1D1F' }}>
                        {error.extractedText.length > 300
                          ? error.extractedText.substring(0, 300) + '...'
                          : error.extractedText}
                      </Text>
                    </View>

                    {/* Tags */}
                    {error.conceptTags && error.conceptTags.length > 0 && (
                      <View style={styles.tagContainer}>
                        {error.conceptTags.slice(0, 5).map((tag, tagIndex) => (
                          <Text key={tagIndex} style={styles.tag}>{tag}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}

                <View style={styles.divider} />
              </View>
            ))}
          </>
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
export async function generateErrorBookPDF(data: ErrorBookData): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');
  const doc = <ErrorBookPDF data={data} />;
  const blob = await pdf(doc).toBlob();
  return blob;
}

// Export function to download PDF
export async function downloadErrorBookPDF(data: ErrorBookData, filename?: string): Promise<void> {
  const blob = await generateErrorBookPDF(data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `错题本_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.appendChild(link);
  URL.revokeObjectURL(url);
}
