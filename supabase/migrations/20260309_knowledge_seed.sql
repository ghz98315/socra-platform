-- =====================================================
-- Socra Platform - Knowledge Graph Seed Data
-- 知识图谱示例数据
-- 创建时间: 2026-03-09
-- =====================================================

-- =====================================================
-- 数学知识点 (小学 1-6 年级)
-- =====================================================

-- 一年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('math', 1, '数的认识', 1, '认识 1-10 的数字', '数字读写、数量对应'),
('math', 1, '数的认识', 1, '认识 11-20 的数字', '十位和个位的概念'),
('math', 1, '加减法', 2, '10 以内加法', '加法概念、加号的认识'),
('math', 1, '加减法', 2, '10 以内减法', '减法概念、减号的认识'),
('math', 1, '加减法', 2, '20 以内进位加法', '凑十法'),
('math', 1, '图形', 1, '认识平面图形', '长方形、正方形、三角形、圆'),
('math', 1, '比较', 1, '比较大小', '大于、小于、等于');

-- 二年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('math', 2, '乘法', 2, '乘法的初步认识', '乘法的意义、乘号'),
('math', 2, '乘法', 2, '2-6 的乘法口诀', '乘法口诀记忆'),
('math', 2, '乘法', 3, '7-9 的乘法口诀', '乘法口诀记忆'),
('math', 2, '除法', 3, '除法的初步认识', '除法的意义、平均分'),
('math', 2, '除法', 3, '用乘法口诀求商', '乘除法关系'),
('math', 2, '混合运算', 3, '加减混合运算', '运算顺序'),
('math', 2, '长度单位', 2, '厘米和米', '长度单位换算'),
('math', 2, '角', 2, '角的初步认识', '直角、锐角、钝角');

-- 三年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('math', 3, '多位数', 2, '万以内数的认识', '数位、读写'),
('math', 3, '加减法', 3, '万以内加减法', '进位、退位'),
('math', 3, '乘法', 3, '多位数乘一位数', '竖式计算'),
('math', 3, '除法', 3, '有余数的除法', '余数概念'),
('math', 3, '分数', 3, '分数的初步认识', '几分之一、几分之几'),
('math', 3, '面积', 3, '面积的认识', '长方形、正方形面积公式'),
('math', 3, '时间', 2, '年、月、日', '时间单位换算'),
('math', 3, '小数', 3, '小数的初步认识', '小数读写、简单加减');

-- 四年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('math', 4, '大数', 2, '亿以内数的认识', '大数读写、比较'),
('math', 4, '乘法', 3, '三位数乘两位数', '竖式计算'),
('math', 4, '除法', 3, '三位数除以两位数', '试商方法'),
('math', 4, '运算律', 3, '加法交换律和结合律', '简便计算'),
('math', 4, '运算律', 3, '乘法交换律和结合律', '简便计算'),
('math', 4, '小数', 3, '小数的意义和性质', '小数点移动'),
('math', 4, '小数', 3, '小数加减法', '小数点对齐'),
('math', 4, '图形', 3, '平行四边形和梯形', '特征、高');

-- 五年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('math', 5, '小数', 3, '小数乘法', '小数点位置'),
('math', 5, '小数', 3, '小数除法', '商的小数点'),
('math', 5, '简易方程', 4, '用字母表示数', '代数式'),
('math', 5, '简易方程', 4, '解简易方程', '等式性质'),
('math', 5, '分数', 4, '分数加减法', '通分'),
('math', 5, '分数', 4, '分数乘法', '约分'),
('math', 5, '多边形', 3, '三角形面积', '底×高÷2'),
('math', 5, '多边形', 3, '平行四边形面积', '底×高'),
('math', 5, '多边形', 4, '梯形面积', '(上底+下底)×高÷2');

-- 六年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('math', 6, '分数', 4, '分数除法', '倒数概念'),
('math', 6, '比', 3, '比的认识', '前项、后项、比值'),
('math', 6, '比', 4, '比例', '比例性质'),
('math', 6, '百分数', 4, '百分数的认识', '百分数和小数互化'),
('math', 6, '百分数', 4, '百分数应用', '折扣、利息'),
('math', 6, '圆', 4, '圆的认识', '半径、直径、周长'),
('math', 6, '圆', 4, '圆的面积', 'πr²'),
('math', 6, '统计', 3, '扇形统计图', '百分比表示'),
('math', 6, '负数', 3, '负数的认识', '正负数概念');

-- =====================================================
-- 语文知识点 (小学 1-6 年级)
-- =====================================================

-- 一年级语文
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('chinese', 1, '拼音', 2, '声母', 'b p m f d t n l 等'),
('chinese', 1, '拼音', 2, '韵母', 'a o e i u ü 等'),
('chinese', 1, '拼音', 3, '整体认读音节', 'zhi chi shi ri 等'),
('chinese', 1, '拼音', 3, '声调', '四声调值'),
('chinese', 1, '汉字', 2, '基本笔画', '横竖撇捺点'),
('chinese', 1, '汉字', 2, '简单汉字书写', '笔顺规则'),
('chinese', 1, '阅读', 1, '简单词语理解', '词语搭配');

-- 二年级语文
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('chinese', 2, '汉字', 2, '偏旁部首', '常见偏旁认识'),
('chinese', 2, '汉字', 3, '形近字', '区分形近字'),
('chinese', 2, '词语', 2, '近义词', '意思相近的词'),
('chinese', 2, '词语', 2, '反义词', '意思相反的词'),
('chinese', 2, '句子', 3, '简单句式', '谁干什么'),
('chinese', 2, '阅读', 2, '短文理解', '提取信息'),
('chinese', 2, '写话', 3, '看图写话', '观察、表达');

-- 三年级语文
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('chinese', 3, '词语', 3, '多音字', '不同读音不同意思'),
('chinese', 3, '词语', 3, '成语积累', '常用成语'),
('chinese', 3, '句子', 3, '修辞手法-比喻', '明喻、暗喻'),
('chinese', 3, '句子', 3, '修改病句', '常见病句类型'),
('chinese', 3, '阅读', 3, '概括段意', '找中心句'),
('chinese', 3, '习作', 3, '记叙文写作', '时间、地点、人物'),
('chinese', 3, '古诗', 3, '古诗理解', '诗意、情感');

-- 四年级语文
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('chinese', 4, '词语', 3, '词语搭配', '动宾、主谓搭配'),
('chinese', 4, '句子', 3, '修辞手法-拟人', '把物当人写'),
('chinese', 4, '句子', 4, '修辞手法-排比', '句式整齐'),
('chinese', 4, '句子', 4, '关联词语', '因果关系、转折关系'),
('chinese', 4, '阅读', 3, '理解重点词句', '联系上下文'),
('chinese', 4, '阅读', 4, '体会人物情感', '心理描写'),
('chinese', 4, '习作', 4, '写景作文', '观察顺序、特点');

-- 五年级语文
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('chinese', 5, '词语', 4, '词语辨析', '近义词区别'),
('chinese', 5, '句子', 4, '句式转换', '陈述句与反问句'),
('chinese', 5, '句子', 4, '缩句和扩句', '句子主干'),
('chinese', 5, '阅读', 4, '理解文章中心', '主题思想'),
('chinese', 5, '阅读', 4, '说明文阅读', '说明方法'),
('chinese', 5, '习作', 4, '读后感', '感悟、联系实际'),
('chinese', 5, '文言文', 4, '文言文入门', '实词、虚词');

-- 六年级语文
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('chinese', 6, '词语', 4, '成语运用', '成语造句'),
('chinese', 6, '句子', 4, '修辞综合运用', '多种修辞'),
('chinese', 6, '阅读', 4, '小说阅读', '人物、情节、环境'),
('chinese', 6, '阅读', 5, '散文阅读', '形散神不散'),
('chinese', 6, '文言文', 4, '文言文翻译', '直译、意译'),
('chinese', 6, '习作', 5, '议论文', '论点、论据、论证'),
('chinese', 6, '综合性学习', 4, '信息提取', '材料分析');

-- =====================================================
-- 英语知识点 (小学 3-6 年级)
-- =====================================================

-- 三年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('english', 3, '字母', 1, '26个字母', '大小写认读'),
('english', 3, '语音', 2, '元音字母发音', 'a e i o u 短音'),
('english', 3, '词汇', 2, '基础词汇', '颜色、数字、动物'),
('english', 3, '句型', 2, '简单问候', 'Hello, Hi, Goodbye'),
('english', 3, '句型', 2, 'This is...', '介绍人物');

-- 四年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('english', 4, '语音', 3, '辅音字母发音', '常见辅音'),
('english', 4, '词汇', 2, '日常词汇', '家庭、学校、食物'),
('english', 4, '语法', 3, 'be动词', 'am is are'),
('english', 4, '语法', 3, '一般现在时', '第三人称单数'),
('english', 4, '句型', 3, '特殊疑问句', 'What, Who, Where');

-- 五年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('english', 5, '语音', 3, '字母组合发音', 'oo, ee, sh, ch'),
('english', 5, '词汇', 3, '动词短语', 'get up, go to school'),
('english', 5, '语法', 3, '现在进行时', 'be doing'),
('english', 5, '语法', 4, '一般过去时', '规则动词过去式'),
('english', 5, '语法', 4, '形容词比较级', 'er, more'),
('english', 5, '阅读', 3, '短文阅读', '信息提取');

-- 六年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points) VALUES
('english', 6, '语法', 4, '一般将来时', 'will, be going to'),
('english', 6, '语法', 4, '名词复数', '规则和不规则变化'),
('english', 6, '语法', 4, '情态动词', 'can, may, must'),
('english', 6, '语法', 5, '被动语态', 'be done'),
('english', 6, '阅读', 4, '长篇阅读', '主旨大意'),
('english', 6, '写作', 4, '简单作文', '5-6 句话');

-- =====================================================
-- 完成
-- =====================================================
