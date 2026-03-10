-- =====================================================
-- Socra Platform - Knowledge Seed Data (Safe Insert)
-- 知识点种子数据 (安全插入，可重复执行)
-- 创建时间: 2026-03-09
-- =====================================================

-- 使用 INSERT ... SELECT ... WHERE NOT EXISTS 避免重复插入

-- =====================================================
-- 数学知识点 (小学 1-6 年级)
-- =====================================================

-- 一年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 1, '数的认识', 1, '认识 1-10 的数字', '数字读写、数量对应'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=1 AND description='认识 1-10 的数字');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 1, '数的认识', 1, '认识 11-20 的数字', '十位和个位的概念'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=1 AND description='认识 11-20 的数字');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 1, '加减法', 2, '10 以内加法', '加法概念、加号的认识'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=1 AND description='10 以内加法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 1, '加减法', 2, '10 以内减法', '减法概念、减号的认识'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=1 AND description='10 以内减法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 1, '加减法', 2, '20 以内进位加法', '凑十法'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=1 AND description='20 以内进位加法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 1, '图形', 1, '认识平面图形', '长方形、正方形、三角形、圆'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=1 AND description='认识平面图形');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 1, '比较', 1, '比较大小', '大于、小于、等于'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=1 AND description='比较大小');

-- 二年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '乘法', 2, '乘法的初步认识', '乘法的意义、乘号'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='乘法的初步认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '乘法', 2, '2-6 的乘法口诀', '乘法口诀记忆'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='2-6 的乘法口诀');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '乘法', 3, '7-9 的乘法口诀', '乘法口诀记忆'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='7-9 的乘法口诀');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '除法', 3, '除法的初步认识', '除法的意义、平均分'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='除法的初步认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '除法', 3, '用乘法口诀求商', '乘除法关系'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='用乘法口诀求商');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '混合运算', 3, '加减混合运算', '运算顺序'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='加减混合运算');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '长度单位', 2, '厘米和米', '长度单位换算'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='厘米和米');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 2, '角', 2, '角的初步认识', '直角、锐角、钝角'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=2 AND description='角的初步认识');

-- 三年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '多位数', 2, '万以内数的认识', '数位、读写'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='万以内数的认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '加减法', 3, '万以内加减法', '进位、退位'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='万以内加减法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '乘法', 3, '多位数乘一位数', '竖式计算'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='多位数乘一位数');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '除法', 3, '有余数的除法', '余数概念'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='有余数的除法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '分数', 3, '分数的初步认识', '几分之一、几分之几'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='分数的初步认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '面积', 3, '面积的认识', '长方形、正方形面积公式'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='面积的认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '时间', 2, '年、月、日', '时间单位换算'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='年、月、日');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 3, '小数', 3, '小数的初步认识', '小数读写、简单加减'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=3 AND description='小数的初步认识');

-- 四年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '大数', 2, '亿以内数的认识', '大数读写、比较'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='亿以内数的认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '乘法', 3, '三位数乘两位数', '竖式计算'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='三位数乘两位数');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '除法', 3, '三位数除以两位数', '试商方法'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='三位数除以两位数');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '运算律', 3, '加法交换律和结合律', '简便计算'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='加法交换律和结合律');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '运算律', 3, '乘法交换律和结合律', '简便计算'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='乘法交换律和结合律');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '小数', 3, '小数的意义和性质', '小数点移动'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='小数的意义和性质');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '小数', 3, '小数加减法', '小数点对齐'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='小数加减法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 4, '图形', 3, '平行四边形和梯形', '特征、高'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=4 AND description='平行四边形和梯形');

-- 五年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '小数', 3, '小数乘法', '小数点位置'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='小数乘法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '小数', 3, '小数除法', '商的小数点'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='小数除法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '简易方程', 4, '用字母表示数', '代数式'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='用字母表示数');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '简易方程', 4, '解简易方程', '等式性质'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='解简易方程');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '分数', 4, '分数加减法', '通分'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='分数加减法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '分数', 4, '分数乘法', '约分'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='分数乘法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '多边形', 3, '三角形面积', '底×高÷2'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='三角形面积');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '多边形', 3, '平行四边形面积', '底×高'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='平行四边形面积');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 5, '多边形', 4, '梯形面积', '(上底+下底)×高÷2'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=5 AND description='梯形面积');

-- 六年级数学
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '分数', 4, '分数除法', '倒数概念'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='分数除法');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '比', 3, '比的认识', '前项、后项、比值'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='比的认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '比', 4, '比例', '比例性质'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='比例');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '百分数', 4, '百分数的认识', '百分数和小数互化'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='百分数的认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '百分数', 4, '百分数应用', '折扣、利息'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='百分数应用');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '圆', 4, '圆的认识', '半径、直径、周长'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='圆的认识');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '圆', 4, '圆的面积', 'πr²'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='圆的面积');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '统计', 3, '扇形统计图', '百分比表示'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='扇形统计图');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'math', 6, '负数', 3, '负数的认识', '正负数概念'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='math' AND grade_level=6 AND description='负数的认识');

-- =====================================================
-- 语文知识点 (小学 1-6 年级) - 精简版
-- =====================================================

-- 一年级语文
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'chinese', 1, '拼音', 2, '声母', 'b p m f d t n l 等'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='chinese' AND grade_level=1 AND description='声母');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'chinese', 1, '拼音', 2, '韵母', 'a o e i u ü 等'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='chinese' AND grade_level=1 AND description='韵母');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'chinese', 1, '拼音', 3, '整体认读音节', 'zhi chi shi ri 等'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='chinese' AND grade_level=1 AND description='整体认读音节');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'chinese', 1, '汉字', 2, '基本笔画', '横竖撇捺点'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='chinese' AND grade_level=1 AND description='基本笔画');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'chinese', 1, '汉字', 2, '简单汉字书写', '笔顺规则'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='chinese' AND grade_level=1 AND description='简单汉字书写');

-- =====================================================
-- 英语知识点 (小学 3-6 年级) - 精简版
-- =====================================================

-- 三年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 3, '字母', 1, '26个字母', '大小写认读'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=3 AND description='26个字母');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 3, '语音', 2, '元音字母发音', 'a e i o u 短音'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=3 AND description='元音字母发音');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 3, '词汇', 2, '基础词汇', '颜色、数字、动物'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=3 AND description='基础词汇');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 3, '句型', 2, '简单问候', 'Hello, Hi, Goodbye'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=3 AND description='简单问候');

-- 四年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 4, '词汇', 2, '日常词汇', '家庭、学校、食物'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=4 AND description='日常词汇');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 4, '语法', 3, 'be动词', 'am is are'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=4 AND description='be动词');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 4, '语法', 3, '一般现在时', '第三人称单数'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=4 AND description='一般现在时');

-- 五年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 5, '语法', 3, '现在进行时', 'be doing'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=5 AND description='现在进行时');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 5, '语法', 4, '一般过去时', '规则动词过去式'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=5 AND description='一般过去时');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 5, '语法', 4, '形容词比较级', 'er, more'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=5 AND description='形容词比较级');

-- 六年级英语
INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 6, '语法', 4, '一般将来时', 'will, be going to'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=6 AND description='一般将来时');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 6, '语法', 4, '名词复数', '规则和不规则变化'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=6 AND description='名词复数');

INSERT INTO knowledge_nodes (subject, grade_level, chapter, difficulty, description, key_points)
SELECT 'english', 6, '语法', 5, '被动语态', 'be done'
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE subject='english' AND grade_level=6 AND description='被动语态');

-- =====================================================
-- 完成
-- =====================================================
SELECT 'Seed data migration completed!' as status;
SELECT COUNT(*) as total_knowledge_nodes FROM knowledge_nodes;
