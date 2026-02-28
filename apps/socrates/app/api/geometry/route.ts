// =====================================================
// Project Socrates - Geometry Parse API
// 几何图形解析API：从OCR文本中提取几何数据
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';

const AI_URL = process.env.AI_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

interface GeometryParseResponse {
  success: boolean;
  geometry?: {
    type: 'triangle' | 'quadrilateral' | 'circle' | 'line' | 'angle' | 'composite' | 'function' | 'unknown';
    points: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
    }>;
    lines: Array<{
      id: string;
      start: string;
      end: string;
      type: 'line' | 'segment' | 'ray';
    }>;
    circles: Array<{
      id: string;
      center: string;
      radius?: number;
      pointOnCircle?: string;
    }>;
    curves: Array<{
      id: string;
      type: 'inverse_proportional' | 'linear' | 'quadratic' | 'exponential';
      equation: string;       // 如 "y=3/x" 或 "y=k/x"
      parameter?: number;     // k值，如 k=3
      pointsOnCurve?: string[]; // 曲线上的点，如 ["A", "B"]
      xRange?: [number, number]; // x的显示范围
      color?: string;
    }>;
    angles: Array<{
      id: string;
      vertex: string;
      point1: string;
      point2: string;
      value?: number;
      showArc: boolean;
    }>;
    labels: Array<{
      targetId: string;
      text: string;
      position?: 'top' | 'bottom' | 'left' | 'right';
    }>;
    relations: Array<{
      type: 'perpendicular' | 'parallel' | 'congruent' | 'similar' | 'tangent' | 'intersect' | 'bisect' | 'midpoint' | 'collinear';
      targets: string[];
      description?: string;
    }>;
    // 显式条件：从题目中提取的已知条件
    conditions: {
      lengths?: string[];      // 长度关系，如 ["AB=6", "BC=4", "BE=BC"]
      angles?: string[];       // 角度关系，如 ["∠A=90°", "∠B=∠C"]
      ratios?: string[];       // 比例关系，如 ["AE:ED=1:2", "AB:CD=3:4"]
      parallels?: string[];    // 平行关系，如 ["AB//CD", "AD//BC"]
      perpendiculars?: string[]; // 垂直关系，如 ["AB⊥CD", "CF⊥BE"]
      midpoints?: string[];    // 中点关系，如 ["D是BC的中点", "E为AB中点"]
      tangents?: string[];     // 相切关系，如 ["AB与⊙O相切"]
      intersections?: string[]; // 相交关系，如 ["AC与BD相交于点O"]
      functions?: string[];    // 函数方程，如 ["y=3/x", "反比例函数经过点A"]
      others?: string[];       // 其他条件
    };
    confidence: number;
  };
  error?: string;
}

const GEOMETRY_PARSE_PROMPT = `你是一个几何图形精确绘制专家。请根据题目描述生成精确的几何图形坐标，并提取所有已知条件。

═══════════════════════════════════════════════════════════
【坐标系统规则 - 防止镜像翻转】
═══════════════════════════════════════════════════════════

使用标准数学坐标系：
- X轴：向右为正方向
- Y轴：向上为正方向（与课本图形一致）
- 图形的"上方"对应Y值大，"下方"对应Y值小
- 图形的"左侧"对应X值小，"右侧"对应X值大

【关键防镜像规则】
- 课本图形中标注在"上方"的点，Y坐标必须更大
- 课本图形中标注在"左侧"的点，X坐标必须更小
- 例如：如果A点在图形上方，B点在下方，则 A.y > B.y

【矩形顶点命名约定 - 非常重要！】
中国初中数学课本的矩形命名习惯：从左下角开始，顺时针排列
- A(左下) → B(右下) → C(右上) → D(左上)，顺时针排列
  A = (-w/2, -h/2) 左下角，Y值最小
  B = (w/2, -h/2)  右下角，Y值最小
  C = (w/2, h/2)   右上角，Y值最大
  D = (-w/2, h/2)  左上角，Y值最大

⚠️ 注意：如果题目中没有明确说明顶点顺序，默认使用以上约定！
⚠️ 这与某些教材从左上角开始不同，请严格按照本规则！

═══════════════════════════════════════════════════════════
【几何关系类型定义】
═══════════════════════════════════════════════════════════

在 relations 数组中输出以下关系：

| 关系类型 | type值 | 说明 | 示例 |
|---------|--------|------|------|
| 垂直 | perpendicular | 两线垂直 | AB⊥CD, CF⊥BE |
| 平行 | parallel | 两线平行 | AB//CD, AD//BC |
| 相交 | intersect | 两线相交 | AC与BD相交于O |
| 相切 | tangent | 直线与圆相切 | AB与⊙O相切于点P |
| 全等 | congruent | 两图形全等 | △ABC≌△DEF |
| 相似 | similar | 两图形相似 | △ABC∽△DEF |
| 平分 | bisect | 线段或角平分 | AD平分∠BAC |
| 中点 | midpoint | 点是线段中点 | D是BC的中点 |
| 共线 | collinear | 多点共线 | A、B、C三点共线 |

═══════════════════════════════════════════════════════════
【条件提取规则】
═══════════════════════════════════════════════════════════

必须从题目中提取所有已知条件到 conditions 对象：

1. lengths（长度关系）：
   - "AB=6" → lengths: ["AB=6"]
   - "BE=BC" → lengths: ["BE=BC"]
   - "AB=AC=5" → lengths: ["AB=5", "AC=5", "AB=AC"]

2. angles（角度关系）：
   - "∠C=90°" → angles: ["∠C=90°"]
   - "∠A=∠B" → angles: ["∠A=∠B"]
   - "∠A+∠B=90°" → angles: ["∠A+∠B=90°"]

3. ratios（比例关系）：
   - "AE:ED=1:2" → ratios: ["AE:ED=1:2"]
   - "AB:CD=3:4" → ratios: ["AB:CD=3:4"]

4. parallels（平行关系）：
   - "AB//CD" → parallels: ["AB//CD"]
   - "AD∥BC" → parallels: ["AD//BC"]

5. perpendiculars（垂直关系）：
   - "AB⊥CD" → perpendiculars: ["AB⊥CD"]
   - "CF垂直于BE" → perpendiculars: ["CF⊥BE"]

6. midpoints（中点关系）：
   - "D是BC的中点" → midpoints: ["D是BC的中点"]
   - "E为AB中点" → midpoints: ["E为AB中点"]

7. tangents（相切关系）：
   - "AB与⊙O相切" → tangents: ["AB与⊙O相切"]
   - "PA切圆O于点A" → tangents: ["PA切⊙O于点A"]

8. intersections（相交关系）：
   - "AC与BD相交于点O" → intersections: ["AC与BD相交于O"]

9. functions（函数方程）：
   - "反比例函数y=k/x" → functions: ["y=k/x"]
   - "函数经过点A(1,3)" → functions: ["函数经过点A(1,3)"]
   - "y=3/x的图象" → functions: ["y=3/x"]

10. others（其他条件）：
   - 无法归类的条件
   - "AB是⊙O的直径" → others: ["AB是⊙O的直径"]

═══════════════════════════════════════════════════════════
【函数曲线类型】
═══════════════════════════════════════════════════════════

支持以下函数曲线类型，在 curves 数组中输出：

| 曲线类型 | type值 | 方程格式 | 说明 |
|---------|--------|---------|------|
| 反比例函数 | inverse_proportional | y=k/x | 双曲线，两个分支 |
| 一次函数 | linear | y=kx+b | 直线 |
| 二次函数 | quadratic | y=ax²+bx+c | 抛物线 |
| 指数函数 | exponential | y=aˣ | 指数曲线 |

【反比例函数特殊规则】
1. 必须指定 k 值（如果已知）
2. xRange 指定显示范围，避开 x=0
3. pointsOnCurve 列出在曲线上的点
4. 需要绘制两个分支（x>0 和 x<0）

示例：
{
  "id": "curve1",
  "type": "inverse_proportional",
  "equation": "y=3/x",
  "parameter": 3,
  "pointsOnCurve": ["A"],
  "xRange": [0.2, 8],
  "color": "#22c55e"
}

═══════════════════════════════════════════════════════════
【输出格式】
═══════════════════════════════════════════════════════════

⚠️ 重要：所有坐标值必须是具体的数值，禁止使用 Math.sqrt()、分数等表达式！
例如：√3 必须写成 1.732，不要写成 Math.sqrt(3)
     3√3/2 必须写成 2.598，不要写成 (3*Math.sqrt(3))/2

{
  "type": "triangle|quadrilateral|circle|function|composite|unknown",
  "points": [
    {"id": "A", "name": "A", "x": 0, "y": 4}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"}
  ],
  "circles": [],
  "curves": [
    {"id": "curve1", "type": "inverse_proportional", "equation": "y=3/x", "parameter": 3, "pointsOnCurve": ["A"], "xRange": [0.2, 8]}
  ],
  "angles": [
    {"id": "angleA", "vertex": "A", "point1": "B", "point2": "C", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "top"}
  ],
  "relations": [
    {"type": "perpendicular", "targets": ["AB", "BC"], "description": "AB⊥BC"}
  ],
  "conditions": {
    "lengths": ["AB=6", "BC=4"],
    "angles": ["∠A=90°"],
    "ratios": ["AE:ED=1:2"],
    "parallels": ["AB//CD"],
    "perpendiculars": ["CF⊥BE"],
    "midpoints": ["D是BC的中点"],
    "tangents": [],
    "intersections": ["AC与BD相交于O"],
    "functions": ["y=3/x", "函数经过点A(1,3)"],
    "others": []
  },
  "confidence": 0.95
}

═══════════════════════════════════════════════════════════
【精确坐标计算规则】
═══════════════════════════════════════════════════════════

【规则1：矩形坐标 - 中国初中数学约定】
矩形ABCD，宽w高h，中心在原点，从左下角顺时针排列：
- A(左下): (-w/2, -h/2) ← Y值最小，起点
- B(右下): (w/2, -h/2)  ← Y值最小
- C(右上): (w/2, h/2)   ← Y值最大
- D(左上): (-w/2, h/2)  ← Y值最大

⚠️ 重要：边AD是左侧垂直边（A在下，D在上），E在AD上意味着E.x = A.x = D.x

【规则2：边上的点必须共线】
- E在AD上（AD是左侧垂直边）→ E.x 必须等于 A.x 和 D.x（因为AD是垂直线）
- E在AB上（AB是底边）→ E.y 必须等于 A.y 和 B.y（因为AB是水平线）
- 用比例计算：E在AD上，AE:ED=1:2 → E.y = A.y + (D.y-A.y) × 1/3
  例如：A(-4,-3), D(-4,3), AE:ED=1:2 → E.y = -3 + (3-(-3)) × 1/3 = -3 + 2 = -1
  所以 E = (-4, -1)

【规则3：垂足坐标】
CF ⊥ BE，F在BE上，需要：
1. F在BE上：F = B + t×(E-B)，t∈[0,1]
2. CF⊥BE：向量(CF)·向量(BE) = 0
解方程得t值

【规则4：中点坐标】
D是BC中点 → D = ((Bx+Cx)/2, (By+Cy)/2)

【规则5：角平分线上的点】
AD平分∠BAC，D在BC上：
- 若AB=AC（等腰），则D是BC中点且AD⊥BC

【规则6：圆上/圆外/圆内的点】
- 点P在⊙O上 → |OP| = R
- 点P在⊙O外 → |OP| > R
- 点P在⊙O内 → |OP| < R

【规则7：切点】
PA切⊙O于A → OA⊥PA，且A在圆上

═══════════════════════════════════════════════════════════
【完整示例1：矩形+垂线+中点】
═══════════════════════════════════════════════════════════

输入："如图，在矩形ABCD中，E为AD边上一点，AE:ED=1:2，连接BE，过C作CF⊥BE交BE于点F"

输出（注意：A在左下角，D在左上角，AD是左侧垂直边）：
{
  "type": "composite",
  "points": [
    {"id": "A", "name": "A", "x": -4, "y": -3},
    {"id": "B", "name": "B", "x": 4, "y": -3},
    {"id": "C", "name": "C", "x": 4, "y": 3},
    {"id": "D", "name": "D", "x": -4, "y": 3},
    {"id": "E", "name": "E", "x": -4, "y": -1},
    {"id": "F", "name": "F", "x": 2.4, "y": -2.1}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "CD", "start": "C", "end": "D", "type": "segment"},
    {"id": "DA", "start": "D", "end": "A", "type": "segment"},
    {"id": "BE", "start": "B", "end": "E", "type": "segment"},
    {"id": "CF", "start": "C", "end": "F", "type": "segment"}
  ],
  "circles": [],
  "angles": [
    {"id": "angleA", "vertex": "A", "point1": "B", "point2": "D", "value": 90, "showArc": true},
    {"id": "angleB", "vertex": "B", "point1": "A", "point2": "C", "value": 90, "showArc": true},
    {"id": "angleC", "vertex": "C", "point1": "B", "point2": "D", "value": 90, "showArc": true},
    {"id": "angleD", "vertex": "D", "point1": "A", "point2": "C", "value": 90, "showArc": true},
    {"id": "angleBFE", "vertex": "F", "point1": "B", "point2": "C", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "bottom"},
    {"targetId": "B", "text": "B", "position": "bottom"},
    {"targetId": "C", "text": "C", "position": "top"},
    {"targetId": "D", "text": "D", "position": "top"},
    {"targetId": "E", "text": "E", "position": "left"},
    {"targetId": "F", "text": "F", "position": "bottom"}
  ],
  "relations": [
    {"type": "perpendicular", "targets": ["AB", "BC"], "description": "矩形四角为直角"},
    {"type": "perpendicular", "targets": ["AB", "AD"], "description": "矩形四角为直角"},
    {"type": "perpendicular", "targets": ["CF", "BE"], "description": "CF⊥BE"},
    {"type": "parallel", "targets": ["AB", "CD"], "description": "矩形对边平行"},
    {"type": "parallel", "targets": ["AD", "BC"], "description": "矩形对边平行"}
  ],
  "conditions": {
    "lengths": [],
    "angles": ["∠A=90°", "∠B=90°", "∠C=90°", "∠D=90°"],
    "ratios": ["AE:ED=1:2"],
    "parallels": ["AB//CD", "AD//BC"],
    "perpendiculars": ["AB⊥AD", "AB⊥BC", "CF⊥BE"],
    "midpoints": [],
    "tangents": [],
    "intersections": ["CF与BE相交于F"],
    "others": ["四边形ABCD是矩形", "E在AD边上", "AD是左侧垂直边，A在下D在上"]
  },
  "confidence": 0.95
}

═══════════════════════════════════════════════════════════
【完整示例2：等腰三角形+中线】
═══════════════════════════════════════════════════════════

输入："如图，在△ABC中，AB=AC，D是BC的中点，连接AD"

输出：
{
  "type": "triangle",
  "points": [
    {"id": "A", "name": "A", "x": 0, "y": 4},
    {"id": "B", "name": "B", "x": -3, "y": -2},
    {"id": "C", "name": "C", "x": 3, "y": -2},
    {"id": "D", "name": "D", "x": 0, "y": -2}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "CA", "start": "C", "end": "A", "type": "segment"},
    {"id": "AD", "start": "A", "end": "D", "type": "segment"}
  ],
  "circles": [],
  "angles": [],
  "labels": [
    {"targetId": "A", "text": "A", "position": "top"},
    {"targetId": "B", "text": "B", "position": "bottom"},
    {"targetId": "C", "text": "C", "position": "bottom"},
    {"targetId": "D", "text": "D", "position": "bottom"}
  ],
  "relations": [
    {"type": "midpoint", "targets": ["D", "BC"], "description": "D是BC的中点"},
    {"type": "perpendicular", "targets": ["AD", "BC"], "description": "等腰三角形底边中线也是高"}
  ],
  "conditions": {
    "lengths": ["AB=AC"],
    "angles": ["∠B=∠C"],
    "ratios": [],
    "parallels": [],
    "perpendiculars": ["AD⊥BC"],
    "midpoints": ["D是BC的中点"],
    "tangents": [],
    "intersections": [],
    "others": ["△ABC是等腰三角形", "AD是中线也是高"]
  },
  "confidence": 0.95
}

═══════════════════════════════════════════════════════════
【完整示例3：圆与切线】
═══════════════════════════════════════════════════════════

输入："如图，AB是⊙O的直径，点C在⊙O上，过点C作⊙O的切线交AB延长线于点D，∠D=30°"

输出：
{
  "type": "circle",
  "points": [
    {"id": "O", "name": "O", "x": 0, "y": 0},
    {"id": "A", "name": "A", "x": -3, "y": 0},
    {"id": "B", "name": "B", "x": 3, "y": 0},
    {"id": "C", "name": "C", "x": 1.5, "y": 2.6},
    {"id": "D", "name": "D", "x": 6, "y": 0}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BD", "start": "B", "end": "D", "type": "ray"},
    {"id": "CD", "start": "C", "end": "D", "type": "line"},
    {"id": "OC", "start": "O", "end": "C", "type": "segment"}
  ],
  "circles": [
    {"id": "circleO", "center": "O", "radius": 3}
  ],
  "angles": [
    {"id": "angleD", "vertex": "D", "point1": "C", "point2": "B", "value": 30, "showArc": true},
    {"id": "angleOCD", "vertex": "C", "point1": "O", "point2": "D", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "O", "text": "O", "position": "bottom"},
    {"targetId": "A", "text": "A", "position": "bottom"},
    {"targetId": "B", "text": "B", "position": "bottom"},
    {"targetId": "C", "text": "C", "position": "top"},
    {"targetId": "D", "text": "D", "position": "bottom"}
  ],
  "relations": [
    {"type": "tangent", "targets": ["CD", "circleO"], "description": "CD是⊙O的切线"},
    {"type": "perpendicular", "targets": ["OC", "CD"], "description": "切线垂直于过切点的半径"}
  ],
  "conditions": {
    "lengths": ["OA=OB=OC=3", "AB=6"],
    "angles": ["∠D=30°", "∠OCD=90°"],
    "ratios": [],
    "parallels": [],
    "perpendiculars": ["OC⊥CD"],
    "midpoints": [],
    "tangents": ["CD切⊙O于点C"],
    "intersections": ["CD与AB延长线相交于D"],
    "others": ["AB是⊙O的直径", "点C在⊙O上"]
  },
  "confidence": 0.9
}

═══════════════════════════════════════════════════════════
【完整示例4：反比例函数+直角三角形】
═══════════════════════════════════════════════════════════

输入："如图，反比例函数y=k/x的图象经过点A(1,3)，与OB交于点C，其中点B(3,0)，若△OAC是直角三角形，则k=______。"

输出：
{
  "type": "function",
  "points": [
    {"id": "O", "name": "O", "x": 0, "y": 0},
    {"id": "A", "name": "A", "x": 1, "y": 3},
    {"id": "B", "name": "B", "x": 3, "y": 0},
    {"id": "C", "name": "C", "x": 2, "y": 1.5}
  ],
  "lines": [
    {"id": "OB", "start": "O", "end": "B", "type": "segment"},
    {"id": "OA", "start": "O", "end": "A", "type": "segment"},
    {"id": "AC", "start": "A", "end": "C", "type": "segment"},
    {"id": "OC", "start": "O", "end": "C", "type": "segment"}
  ],
  "circles": [],
  "curves": [
    {
      "id": "curve1",
      "type": "inverse_proportional",
      "equation": "y=3/x",
      "parameter": 3,
      "pointsOnCurve": ["A", "C"],
      "xRange": [0.3, 5],
      "color": "#22c55e"
    }
  ],
  "angles": [
    {"id": "angleOAC", "vertex": "A", "point1": "O", "point2": "C", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "O", "text": "O", "position": "bottom-left"},
    {"targetId": "A", "text": "A", "position": "top"},
    {"targetId": "B", "text": "B", "position": "bottom"},
    {"targetId": "C", "text": "C", "position": "right"}
  ],
  "relations": [
    {"type": "intersect", "targets": ["curve1", "OB"], "description": "曲线与OB相交于C"}
  ],
  "conditions": {
    "lengths": [],
    "angles": ["∠OAC=90°"],
    "ratios": [],
    "parallels": [],
    "perpendiculars": ["OA⊥AC"],
    "midpoints": [],
    "tangents": [],
    "intersections": ["曲线与OB相交于C"],
    "functions": ["y=k/x", "函数经过点A(1,3)", "k=3"],
    "others": ["△OAC是直角三角形", "点B在x轴上"]
  },
  "confidence": 0.9
}

═══════════════════════════════════════════════════════════
【完整示例5：坐标系中的直角三角形】
═══════════════════════════════════════════════════════════

输入："如图，Rt△OAB与Rt△OBC位于平面直角坐标系中，∠AOB=∠BOC=30°，BA⊥OA，CB⊥OB，若AB=√3"

输出（注意：O在原点，A在x轴正方向，B在第一象限）：
{
  "type": "composite",
  "points": [
    {"id": "O", "name": "O", "x": 0, "y": 0},
    {"id": "A", "name": "A", "x": 3, "y": 0},
    {"id": "B", "name": "B", "x": 3, "y": 1.732},
    {"id": "C", "name": "C", "x": 2.598, "y": 3}
  ],
  "lines": [
    {"id": "OA", "start": "O", "end": "A", "type": "segment"},
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "OB", "start": "O", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "OC", "start": "O", "end": "C", "type": "segment"}
  ],
  "circles": [],
  "curves": [],
  "angles": [
    {"id": "angleOAB", "vertex": "A", "point1": "O", "point2": "B", "value": 90, "showArc": true},
    {"id": "angleOBC", "vertex": "B", "point1": "O", "point2": "C", "value": 90, "showArc": true},
    {"id": "angleAOB", "vertex": "O", "point1": "A", "point2": "B", "value": 30, "showArc": true},
    {"id": "angleBOC", "vertex": "O", "point1": "B", "point2": "C", "value": 30, "showArc": true}
  ],
  "labels": [
    {"targetId": "O", "text": "O", "position": "bottom-left"},
    {"targetId": "A", "text": "A", "position": "bottom"},
    {"targetId": "B", "text": "B", "position": "right"},
    {"targetId": "C", "text": "C", "position": "top"}
  ],
  "relations": [
    {"type": "perpendicular", "targets": ["AB", "OA"], "description": "BA⊥OA"},
    {"type": "perpendicular", "targets": ["BC", "OB"], "description": "CB⊥OB"}
  ],
  "conditions": {
    "lengths": ["AB=1.732"],
    "angles": ["∠AOB=30°", "∠BOC=30°", "∠OAB=90°", "∠OBC=90°"],
    "ratios": [],
    "parallels": [],
    "perpendiculars": ["BA⊥OA", "CB⊥OB"],
    "midpoints": [],
    "tangents": [],
    "intersections": [],
    "functions": [],
    "others": ["Rt△OAB和Rt△OBC在平面直角坐标系中", "O是坐标原点"]
  },
  "confidence": 0.9
}
═══════════════════════════════════════════════════════════

1. □ 坐标是否防止镜像？（上方点Y值大，左侧点X值小）
2. □ 矩形顶点顺序是否正确？（A左下→B右下→C右上→D左上）
3. □ 边上的点是否共线？（x或y与边端点相同）
4. □ 中点坐标是否正确？
5. □ 垂直关系是否满足向量点积为0？
6. □ 直角是否标记90度并showArc？
7. □ 所有辅助线是否添加？
8. □ relations数组是否包含所有关系？
9. □ conditions是否提取所有已知条件？
10. □ 标签位置是否合理？

只返回JSON，不要有其他文字。`;

export async function POST(req: NextRequest): Promise<NextResponse<GeometryParseResponse>> {
  try {
    const body = await req.json();
    const { text, subject } = body as { text?: string; subject?: string };

    if (!text) {
      return NextResponse.json({
        success: false,
        error: '缺少题目文本',
      }, { status: 400 });
    }

    console.log('Geometry API received text:', text.substring(0, 200));

    // 检查是否是几何相关题目 - 扩展关键词列表
    const geometryKeywords = [
      // 基本图形
      '△', '三角形', '四边形', '矩形', '正方形', '圆', '直径', '半径',
      '圆心', '切线', '弦', '弧', '扇形', '菱形', '平行四边形', '梯形',
      // 点和线
      '∠', '角', '线段', '直线', '射线', '点A', '点B', '点C', '点D', '点O',
      // 关系
      '垂直', '平行', '全等', '相似', '相交', '中点', '垂线', '高', '中线',
      // 图形描述
      '如图', '⊙', '⊙O', 'ABCD', 'AB=', 'BC=', 'CD=', 'DA=',
      // 常见字母组合
      'AB', 'BC', 'CD', 'DA', 'AC', 'BD', 'OA', 'OB', 'OC', 'OD',
      // 角度相关
      '度', '∠A', '∠B', '∠C', '∠D', '90°', '60°', '45°', '30°',
      // 其他几何术语
      '对角线', '周长', '面积', '勾股', '斜边', '直角边', '等腰', '等边',
      // 函数相关
      '函数', '反比例', '正比例', 'y=', 'k/x', '图象', '坐标', 'x轴', 'y轴',
      '一次函数', '二次函数', '抛物线', '双曲线', '象限', '交点'
    ];

    const hasGeometryContent = geometryKeywords.some(keyword => text.includes(keyword));
    console.log('Has geometry content:', hasGeometryContent, 'Keywords found:',
      geometryKeywords.filter(k => text.includes(k)));

    if (!hasGeometryContent) {
      console.log('No geometry keywords found, returning unknown');
      return NextResponse.json({
        success: true,
        geometry: {
          type: 'unknown',
          points: [],
          lines: [],
          circles: [],
          curves: [],
          angles: [],
          labels: [],
          relations: [],
          conditions: {
            lengths: [],
            angles: [],
            ratios: [],
            parallels: [],
            perpendiculars: [],
            midpoints: [],
            tangents: [],
            intersections: [],
            functions: [],
            others: [],
          },
          confidence: 0,
        },
      });
    }

    const apiKey = process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      console.error('Geometry API: No AI API key configured');
      return NextResponse.json({
        success: false,
        error: 'AI服务未配置，请检查环境变量 AI_API_KEY_LOGIC 或 DASHSCOPE_API_KEY',
      }, { status: 500 });
    }

    // 调用AI解析几何图形
    console.log('Calling AI for geometry parsing...');
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: GEOMETRY_PARSE_PROMPT,
          },
          {
            role: 'user',
            content: `请分析以下题目中的几何图形：\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI parse error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `AI解析失败(${response.status}): ${errorText.substring(0, 200)}`,
      }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    console.log('AI response content:', content.substring(0, 500));

    // 尝试解析JSON
    let geometry;
    try {
      // 提取JSON部分（可能被markdown包裹）
      let jsonStr = content.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || jsonStr;
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.match(/```\s*([\s\S]*?)\s*```/)?.[1] || jsonStr;
      }

      // 处理 Math 表达式：将 Math.sqrt(n) 替换为计算后的数值
      // 例如：Math.sqrt(3) → 1.732, (3 * Math.sqrt(3)) / 2 → 2.598
      const evaluateMathExpressions = (str: string): string => {
        // 处理复杂的 Math 表达式
        const mathRegex = /Math\.\w+\([^)]+\)|\d+\.?\d*\s*[\+\-\*\/]\s*Math\.\w+\([^)]+\)|\([^)]*Math\.\w+\([^)]+\)[^)]*\)/g;
        let result = str;

        // 多次替换直到没有 Math 表达式
        let iterations = 0;
        while (result.includes('Math.') && iterations < 10) {
          result = result.replace(/Math\.sqrt\((\d+\.?\d*)\)/g, (_, num) => {
            return Math.sqrt(parseFloat(num)).toFixed(3);
          });
          result = result.replace(/\((\d+\.?\d*)\s*\*\s*([\d.]+)\)\s*\/\s*(\d+\.?\d*)/g, (_, a, b, c) => {
            return (parseFloat(a) * parseFloat(b) / parseFloat(c)).toFixed(3);
          });
          result = result.replace(/(\d+\.?\d*)\s*\+\s*Math\.sqrt\(\d+\.?\d*\)\s*\*\s*Math\.sqrt\(\d+\.?\d*\)/g, (match) => {
            try {
              return eval(match).toFixed(3);
            } catch {
              return match;
            }
          });
          iterations++;
        }

        return result;
      };

      jsonStr = evaluateMathExpressions(jsonStr);
      console.log('Parsing JSON:', jsonStr.substring(0, 300));

      geometry = JSON.parse(jsonStr);
      console.log('Parsed geometry type:', geometry.type);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message, 'Content:', content.substring(0, 500));
      return NextResponse.json({
        success: false,
        error: `图形数据解析失败: ${parseError.message}`,
      }, { status: 500 });
    }

    // 验证并补充默认值
    geometry = {
      type: geometry.type || 'unknown',
      points: geometry.points || [],
      lines: geometry.lines || [],
      circles: geometry.circles || [],
      curves: geometry.curves || [],
      angles: geometry.angles || [],
      labels: geometry.labels || [],
      relations: geometry.relations || [],
      conditions: geometry.conditions || {
        lengths: [],
        angles: [],
        ratios: [],
        parallels: [],
        perpendiculars: [],
        midpoints: [],
        tangents: [],
        intersections: [],
        functions: [],
        others: [],
      },
      confidence: geometry.confidence || 0.5,
    };

    return NextResponse.json({
      success: true,
      geometry,
    });

  } catch (error: any) {
    console.error('Geometry parse API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '图形解析失败',
    }, { status: 500 });
  }
}

// GET endpoint - 获取服务状态
export async function GET() {
  const hasAIKey = !!(process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY);

  return NextResponse.json({
    config: {
      provider: hasAIKey ? 'qwen-plus' : 'unavailable',
      method: hasAIKey ? '通义千问 (云端)' : '未配置',
      available: hasAIKey,
    },
  });
}
