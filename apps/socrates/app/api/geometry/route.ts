// =====================================================
// Project Socrates - Geometry Parse API
// 几何图形解析API：从OCR文本中提取几何数据
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';

const AI_URL = process.env.AI_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const AI_REQUEST_TIMEOUT_MS = 12000;

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

type GeometryData = NonNullable<GeometryParseResponse['geometry']>;
type GeometryRelation = GeometryData['relations'][number];
type GeometryConditions = NonNullable<GeometryData['conditions']>;

const EMPTY_CONDITIONS = (): GeometryConditions => ({
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
});

const EMPTY_GEOMETRY = (): GeometryData => normalizeGeometry({
  type: 'unknown',
  confidence: 0,
});

const normalizeGeometry = (geometry?: Partial<GeometryData> | null): GeometryData => ({
  type: geometry?.type || 'unknown',
  points: Array.isArray(geometry?.points) ? geometry.points : [],
  lines: Array.isArray(geometry?.lines) ? geometry.lines : [],
  circles: Array.isArray(geometry?.circles) ? geometry.circles : [],
  curves: Array.isArray(geometry?.curves) ? geometry.curves : [],
  angles: Array.isArray(geometry?.angles) ? geometry.angles : [],
  labels: Array.isArray(geometry?.labels) ? geometry.labels : [],
  relations: Array.isArray(geometry?.relations) ? geometry.relations : [],
  conditions: {
    ...EMPTY_CONDITIONS(),
    ...(geometry?.conditions || {}),
  },
  confidence: typeof geometry?.confidence === 'number' ? geometry.confidence : 0.5,
});

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const countPatternMatches = (text: string, patterns: RegExp[]): number =>
  patterns.reduce((total, pattern) => total + [...text.matchAll(pattern)].length, 0);

const detectGeometrySignals = (text: string) => {
  const normalized = text.replace(/\s+/g, '');

  const strongShapeCount = countPatternMatches(normalized, [
    /三角形|四边形|矩形|正方形|平行四边形|梯形|菱形|圆|圆心|半径|直径|弧|扇形|切线/gu,
    /线段|直线|射线|中点|垂直|平行|相交|角平分线|高|中线|周长|面积/gu,
    /如图|下图|图中|图形|几何/gu,
  ]);

  const functionGraphCount = countPatternMatches(normalized, [
    /函数图像|函数图象|反比例函数|正比例函数|一次函数|二次函数|抛物线|双曲线/gu,
    /坐标系|平面直角坐标系|x轴|y轴|象限/gu,
    /y\s*=|k\/x|x\^2/gu,
  ]);

  const pointMentionCount = countPatternMatches(normalized, [
    /点[A-Z]/g,
    /[A-Z]\((-?\d+(?:\.\d+)?)[,，](-?\d+(?:\.\d+)?)\)/g,
  ]);

  const relationCount = countPatternMatches(normalized, [
    /∠[A-Z]{1,3}|角[A-Z]{1,3}|直角|\d+°/gu,
    /[A-Z]{2}(?:\/\/|⊥|∥)[A-Z]{2}/g,
    /[A-Z]{2}=[A-Z]{2}|[A-Z]{2}:\s*[A-Z]{2}=\d+:\d+/g,
    /交于点[A-Z]|在[A-Z]{2}上/gu,
  ]);

  const explicitFigureRefCount = countPatternMatches(normalized, [
    /△[A-Z]{3}|⊙[A-Z]/g,
    /Rt△[A-Z]{3}|矩形[A-Z]{4}|正方形[A-Z]{4}|菱形[A-Z]{4}/gu,
  ]);

  return {
    strongShapeCount,
    functionGraphCount,
    pointMentionCount,
    relationCount,
    explicitFigureRefCount,
  };
};

const isLikelyGeometryText = (text: string, subject?: string): boolean => {
  if (subject && subject !== 'math') {
    return false;
  }

  const signals = detectGeometrySignals(text);

  if (signals.strongShapeCount > 0) {
    return true;
  }

  if (signals.functionGraphCount > 0) {
    return true;
  }

  if (signals.explicitFigureRefCount > 0) {
    return true;
  }

  return signals.pointMentionCount >= 2 && signals.relationCount >= 1;
};

const buildLabels = (pointIds: string[]): GeometryData['labels'] =>
  pointIds.map((id, idx) => ({
    targetId: id,
    text: id,
    position: idx === 0 ? 'top' : idx % 2 === 0 ? 'right' : 'bottom',
  }));

const buildCycleLines = (pointIds: string[]): GeometryData['lines'] => {
  if (pointIds.length < 2) return [];
  return pointIds.map((id, idx) => {
    const next = pointIds[(idx + 1) % pointIds.length];
    return {
      id: `${id}${next}`,
      start: id,
      end: next,
      type: 'segment' as const,
    };
  });
};

const LINE_TOKEN_REGEX = /[A-Z]{2}/g;

const collectLineTokens = (values: Array<string | undefined> | undefined): string[] => unique(
  (values || [])
    .flatMap((value) => value?.match(LINE_TOKEN_REGEX) || [])
    .filter((token) => token.length === 2),
);

const completeGeometryLines = (geometry: GeometryData): GeometryData => {
  if (!geometry.points.length) {
    return geometry;
  }

  const pointIds = new Set(geometry.points.map((point) => point.id));
  const nextLines = [...geometry.lines];
  const seen = new Set(
    geometry.lines.map((line) => [line.start, line.end].sort().join(':')),
  );

  const addSegment = (start: string, end: string, id?: string) => {
    if (!start || !end || start === end) return;
    if (!pointIds.has(start) || !pointIds.has(end)) return;

    const key = [start, end].sort().join(':');
    if (seen.has(key)) return;

    seen.add(key);
    nextLines.push({
      id: id && /^[A-Z]{2}$/.test(id) ? id : `${start}${end}`,
      start,
      end,
      type: 'segment',
    });
  };

  for (const angle of geometry.angles) {
    addSegment(angle.vertex, angle.point1, `${angle.vertex}${angle.point1}`);
    addSegment(angle.vertex, angle.point2, `${angle.vertex}${angle.point2}`);
  }

  for (const relation of geometry.relations) {
    for (const target of relation.targets) {
      if (/^[A-Z]{2}$/.test(target)) {
        addSegment(target[0], target[1], target);
      }
    }
  }

  const conditionLineTokens = collectLineTokens([
    ...(geometry.conditions.lengths || []),
    ...(geometry.conditions.ratios || []),
    ...(geometry.conditions.parallels || []),
    ...(geometry.conditions.perpendiculars || []),
    ...(geometry.conditions.intersections || []),
    ...(geometry.conditions.tangents || []),
    ...(geometry.conditions.others || []),
  ]);

  for (const token of conditionLineTokens) {
    addSegment(token[0], token[1], token);
  }

  if (nextLines.length === 0) {
    if (geometry.type === 'triangle' && geometry.points.length >= 3) {
      nextLines.push(...buildCycleLines(geometry.points.slice(0, 3).map((point) => point.id)));
    } else if (geometry.type === 'quadrilateral' && geometry.points.length >= 4) {
      nextLines.push(...buildCycleLines(geometry.points.slice(0, 4).map((point) => point.id)));
    }
  }

  return nextLines.length === geometry.lines.length
    ? geometry
    : {
        ...geometry,
        lines: nextLines,
      };
};

const extractJsonObject = (content: string): string | null => {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth++;
    if (char === '}') depth--;

    if (depth === 0) {
      return trimmed.slice(start, i + 1).trim();
    }
  }

  return null;
};

const sanitizeJsonString = (input: string): string => input.replace(/,\s*([}\]])/g, '$1');

const evaluateMathExpressions = (input: string): string => {
  let result = input;
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

  return sanitizeJsonString(result);
};

const parseGeometryContent = (content: string): GeometryData | null => {
  const jsonStr = extractJsonObject(content);
  if (!jsonStr) return null;
  return completeGeometryLines(normalizeGeometry(JSON.parse(evaluateMathExpressions(jsonStr))));
};

const extractPointNames = (text: string, count: number): string[] => {
  const matches = [
    ...text.matchAll(/点\s*([A-Z])/g),
    ...text.matchAll(/[△▵]\s*([A-Z]{3})/g),
    ...text.matchAll(/([A-Z]{4})/g),
  ];

  const names: string[] = [];
  for (const match of matches) {
    const token = match[1] || '';
    for (const ch of token) {
      if (/[A-Z]/.test(ch) && !names.includes(ch)) {
        names.push(ch);
      }
      if (names.length >= count) return names;
    }
  }

  return names;
};

const extractCoordinatePoints = (text: string): GeometryData['points'] => {
  const points: GeometryData['points'] = [];
  const seen = new Set<string>();
  const regex = /([A-Z])\s*\(\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*\)/g;

  for (const match of text.matchAll(regex)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    points.push({
      id,
      name: id,
      x: Number(match[2]),
      y: Number(match[3]),
    });
  }

  if (!seen.has('O') && /坐标原点|原点/.test(text)) {
    points.push({ id: 'O', name: 'O', x: 0, y: 0 });
  }

  return points;
};

const extractConditions = (text: string): GeometryConditions => {
  const matches = (regex: RegExp) => unique([...text.matchAll(regex)].map((match) => match[0].replace(/\s+/g, '')));

  const conditions = EMPTY_CONDITIONS();
  conditions.lengths = matches(/[A-Z]{1,2}\s*=\s*(?:[A-Z]{1,2}|\d+(?:\.\d+)?|√\d+|\d+\/\d+)/g);
  conditions.angles = matches(/∠\s*[A-Z]{1,3}\s*=\s*(?:\d+(?:\.\d+)?°|∠\s*[A-Z]{1,3})/g);
  conditions.ratios = matches(/[A-Z]{1,2}\s*:\s*[A-Z]{1,2}\s*=\s*\d+\s*:\s*\d+/g);
  conditions.parallels = matches(/[A-Z]{2}\s*(?:\/\/|∥|平行于)\s*[A-Z]{2}/g);
  conditions.perpendiculars = matches(/[A-Z]{2}\s*(?:⊥|垂直于)\s*[A-Z]{2}/g);
  conditions.functions = matches(/y\s*=\s*[^，。\s]+/g);
  conditions.intersections = matches(/[A-Z]{2}.*?交于点[A-Z]/g);

  if (/中点/.test(text)) {
    conditions.midpoints = unique([
      ...matches(/[A-Z]是[A-Z]{2}的中点/g),
      ...matches(/[A-Z]为[A-Z]{2}中点/g),
    ]);
  }

  if (/切线|相切/.test(text)) {
    conditions.tangents = unique([
      ...matches(/[A-Z]{2}.*?切线/g),
      ...matches(/[A-Z]{2}.*?相切/g),
    ]);
  }

  return conditions;
};

const conditionsToRelations = (conditions: GeometryConditions): GeometryRelation[] => {
  const relations: GeometryRelation[] = [];

  for (const entry of conditions.perpendiculars || []) {
    const match = entry.match(/([A-Z]{2}).*?(?:⊥|垂直于)([A-Z]{2})/);
    if (match) {
      relations.push({
        type: 'perpendicular',
        targets: [match[1], match[2]],
        description: entry,
      });
    }
  }

  for (const entry of conditions.parallels || []) {
    const match = entry.match(/([A-Z]{2}).*?(?:\/\/|∥|平行于)([A-Z]{2})/);
    if (match) {
      relations.push({
        type: 'parallel',
        targets: [match[1], match[2]],
        description: entry,
      });
    }
  }

  for (const entry of conditions.tangents || []) {
    const match = entry.match(/([A-Z]{2}).*?(?:⊙|圆)([A-Z])/);
    if (match) {
      relations.push({
        type: 'tangent',
        targets: [match[1], `circle${match[2]}`],
        description: entry,
      });
    }
  }

  return relations;
};

const buildFallbackGeometry = (text: string): GeometryData => {
  const conditions = extractConditions(text);
  const relations = conditionsToRelations(conditions);
  const coordinatePoints = extractCoordinatePoints(text);
  const hasFunction = /y\s*=|函数|图象|图像|抛物线|双曲线|坐标/.test(text);
  const hasCircle = /⊙|圆|直径|半径|圆心|切线/.test(text);
  const hasQuadrilateral = /四边形|矩形|正方形|平行四边形|梯形|菱形/.test(text);
  const hasTriangle = /△|三角形|等腰|等边|勾股|直角三角形/.test(text);

  const hasRectangleProjectionPattern =
    /矩形/.test(text) &&
    /E[为在].*AD|AD边上一点.*E|E为AD边上一点/.test(text) &&
    /BE/.test(text) &&
    /CF/.test(text) &&
    /交BE于点F|交.*于点F|点F/.test(text);

  if (hasRectangleProjectionPattern) {
    const width = 6;
    const height = 8;
    const A = { id: 'A', name: 'A', x: -width / 2, y: -height / 2 };
    const B = { id: 'B', name: 'B', x: width / 2, y: -height / 2 };
    const C = { id: 'C', name: 'C', x: width / 2, y: height / 2 };
    const D = { id: 'D', name: 'D', x: -width / 2, y: height / 2 };

    let eY = -height / 2 + Math.sqrt(height * height - width * width);
    const ratioMatch = text.match(/AE\s*:\s*ED\s*=\s*(\d+)\s*:\s*(\d+)/i);
    if (ratioMatch) {
      const ae = Number(ratioMatch[1]);
      const ed = Number(ratioMatch[2]);
      if (ae > 0 && ed > 0) {
        eY = A.y + height * (ae / (ae + ed));
      }
    }

    const E = { id: 'E', name: 'E', x: A.x, y: Number(eY.toFixed(3)) };
    const beVector = { x: E.x - B.x, y: E.y - B.y };
    const t = ((C.x - B.x) * beVector.x + (C.y - B.y) * beVector.y) /
      (beVector.x * beVector.x + beVector.y * beVector.y);
    const F = {
      id: 'F',
      name: 'F',
      x: Number((B.x + t * beVector.x).toFixed(3)),
      y: Number((B.y + t * beVector.y).toFixed(3)),
    };

    return normalizeGeometry({
      type: 'composite',
      points: [A, B, C, D, E, F],
      lines: [
        { id: 'AB', start: 'A', end: 'B', type: 'segment' },
        { id: 'BC', start: 'B', end: 'C', type: 'segment' },
        { id: 'CD', start: 'C', end: 'D', type: 'segment' },
        { id: 'DA', start: 'D', end: 'A', type: 'segment' },
        { id: 'BE', start: 'B', end: 'E', type: 'segment' },
        { id: 'CF', start: 'C', end: 'F', type: 'segment' },
      ],
      circles: [],
      curves: [],
      angles: [
        { id: 'angleA', vertex: 'A', point1: 'B', point2: 'D', value: 90, showArc: true },
        { id: 'angleB', vertex: 'B', point1: 'A', point2: 'C', value: 90, showArc: true },
        { id: 'angleC', vertex: 'C', point1: 'B', point2: 'D', value: 90, showArc: true },
        { id: 'angleD', vertex: 'D', point1: 'A', point2: 'C', value: 90, showArc: true },
        { id: 'angleBFC', vertex: 'F', point1: 'B', point2: 'C', value: 90, showArc: true },
      ],
      labels: [
        { targetId: 'A', text: 'A', position: 'bottom' },
        { targetId: 'B', text: 'B', position: 'bottom' },
        { targetId: 'C', text: 'C', position: 'top' },
        { targetId: 'D', text: 'D', position: 'top' },
        { targetId: 'E', text: 'E', position: 'left' },
        { targetId: 'F', text: 'F', position: 'bottom' },
      ],
      relations: unique([
        ...relations,
        { type: 'perpendicular', targets: ['AB', 'BC'], description: '矩形四角为直角' },
        { type: 'perpendicular', targets: ['AB', 'AD'], description: '矩形四角为直角' },
        { type: 'perpendicular', targets: ['CF', 'BE'], description: 'CF⊥BE' },
        { type: 'parallel', targets: ['AB', 'CD'], description: '矩形对边平行' },
        { type: 'parallel', targets: ['AD', 'BC'], description: '矩形对边平行' },
        { type: 'intersect', targets: ['CF', 'BE'], description: 'CF与BE相交于F' },
      ].map((relation) => JSON.stringify(relation))).map((relation) => JSON.parse(relation)),
      conditions: {
        ...conditions,
        angles: unique([...(conditions.angles || []), '∠A=90°', '∠B=90°', '∠C=90°', '∠D=90°']),
        parallels: unique([...(conditions.parallels || []), 'AB//CD', 'AD//BC']),
        perpendiculars: unique([...(conditions.perpendiculars || []), 'AB⊥AD', 'AB⊥BC', 'CF⊥BE']),
        intersections: unique([...(conditions.intersections || []), 'CF与BE相交于F']),
        others: unique([...(conditions.others || []), '四边形ABCD是矩形', 'E在AD边上']),
      },
      confidence: 0.9,
    });
  }

  if (hasFunction) {
    const points = coordinatePoints.length > 0 ? coordinatePoints : [
      { id: 'O', name: 'O', x: 0, y: 0 },
      { id: 'A', name: 'A', x: 1, y: 3 },
      { id: 'B', name: 'B', x: 3, y: 0 },
    ];

    const equation =
      conditions.functions?.[0] ||
      (text.includes('k/x') || text.includes('反比例') ? 'y=k/x' : 'y=x');

    const curveType =
      text.includes('k/x') || text.includes('反比例')
        ? 'inverse_proportional'
        : text.includes('二次函数') || /x(?:²|\^2)/.test(text)
          ? 'quadratic'
          : 'linear';

    return normalizeGeometry({
      type: points.length >= 3 ? 'composite' : 'function',
      points,
      lines: points.some((p) => p.id === 'O') && points.some((p) => p.id === 'B')
        ? [{ id: 'OB', start: 'O', end: 'B', type: 'segment' }]
        : [],
      circles: [],
      curves: [{
        id: 'curve1',
        type: curveType,
        equation,
        parameter: curveType === 'inverse_proportional' ? 3 : undefined,
        pointsOnCurve: points.filter((p) => p.id !== 'O').slice(0, 2).map((p) => p.id),
        xRange: curveType === 'inverse_proportional' ? [0.5, 8] : undefined,
      }],
      angles: [],
      labels: buildLabels(points.map((p) => p.id)),
      relations,
      conditions,
      confidence: 0.62,
    });
  }

  if (hasCircle) {
    const centerId = (text.match(/[⊙圆][A-Z]/)?.[0] || 'O').replace(/[⊙圆]/g, '') || 'O';
    const diameterMatch = text.match(/([A-Z])([A-Z])是[⊙圆][A-Z]的直径/);
    const points = coordinatePoints.length > 0 ? coordinatePoints : [
      { id: centerId, name: centerId, x: 0, y: 0 },
      { id: diameterMatch?.[1] || 'A', name: diameterMatch?.[1] || 'A', x: -3, y: 0 },
      { id: diameterMatch?.[2] || 'B', name: diameterMatch?.[2] || 'B', x: 3, y: 0 },
      { id: 'C', name: 'C', x: 0, y: 3 },
    ];

    const centerExists = points.some((p) => p.id === centerId)
      ? points
      : [{ id: centerId, name: centerId, x: 0, y: 0 }, ...points];

    const circlePoint = centerExists.find((p) => p.id !== centerId)?.id || 'A';

    return normalizeGeometry({
      type: 'circle',
      points: centerExists,
      lines: diameterMatch
        ? [{ id: `${diameterMatch[1]}${diameterMatch[2]}`, start: diameterMatch[1], end: diameterMatch[2], type: 'segment' }]
        : [],
      circles: [{ id: `circle${centerId}`, center: centerId, pointOnCircle: circlePoint }],
      curves: [],
      angles: [],
      labels: buildLabels(centerExists.map((p) => p.id)),
      relations,
      conditions,
      confidence: 0.64,
    });
  }

  if (hasQuadrilateral) {
    const names = extractPointNames(text, 4);
    const ids = names.length >= 4 ? names.slice(0, 4) : ['A', 'B', 'C', 'D'];
    const points = coordinatePoints.length >= 4 ? coordinatePoints.slice(0, 4) : [
      { id: ids[0], name: ids[0], x: -4, y: -3 },
      { id: ids[1], name: ids[1], x: 4, y: -3 },
      { id: ids[2], name: ids[2], x: 4, y: 3 },
      { id: ids[3], name: ids[3], x: -4, y: 3 },
    ];

    return normalizeGeometry({
      type: 'quadrilateral',
      points,
      lines: buildCycleLines(points.map((p) => p.id)),
      circles: [],
      curves: [],
      angles: [],
      labels: buildLabels(points.map((p) => p.id)),
      relations,
      conditions,
      confidence: 0.6,
    });
  }

  if (hasTriangle) {
    const names = extractPointNames(text, 3);
    const ids = names.length >= 3 ? names.slice(0, 3) : ['A', 'B', 'C'];
    const points = coordinatePoints.length >= 3 ? coordinatePoints.slice(0, 3) : [
      { id: ids[0], name: ids[0], x: 0, y: 4 },
      { id: ids[1], name: ids[1], x: -3, y: -2 },
      { id: ids[2], name: ids[2], x: 3, y: -2 },
    ];

    return normalizeGeometry({
      type: 'triangle',
      points,
      lines: buildCycleLines(points.map((p) => p.id)),
      circles: [],
      curves: [],
      angles: [],
      labels: buildLabels(points.map((p) => p.id)),
      relations,
      conditions,
      confidence: 0.58,
    });
  }

  return normalizeGeometry({
    type: 'unknown',
    conditions,
    relations,
    confidence: 0,
  });
};

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

【规则3：垂足坐标 - 必须精确计算！】
CF ⊥ BE，F在BE上，需要同时满足两个条件：
1. F在BE上：F = B + t×(E-B)，t∈[0,1]
   即 F.x = B.x + t×(E.x - B.x), F.y = B.y + t×(E.y - B.y)
2. CF⊥BE：向量CF · 向量BE = 0
   (F.x-C.x)×(E.x-B.x) + (F.y-C.y)×(E.y-B.y) = 0

求解t的公式：
t = ((C.x-B.x)×(E.x-B.x) + (C.y-B.y)×(E.y-B.y)) / ((E.x-B.x)² + (E.y-B.y)²)

⚠️ 必须验证：计算出的F点是否真的在BE线段上（t在0到1之间），且CF确实垂直于BE！

示例计算（矩形宽8高6，A(-4,-3), B(4,-3), C(4,3), D(-4,3), E(-4,-1)）：
- BE向量 = (-4-4, -1-(-3)) = (-8, 2)
- 设F在BE上，F = B + t×(-8, 2) = (4-8t, -3+2t)
- CF向量 = (4-8t-4, -3+2t-3) = (-8t, 2t-6)
- CF⊥BE: (-8t)×(-8) + (2t-6)×2 = 0
  64t + 4t - 12 = 0
  68t = 12
  t = 12/68 ≈ 0.176
- F = (4-8×0.176, -3+2×0.176) = (4-1.41, -3+0.35) = (2.59, -2.65)

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

输出（注意：A在左下角，D在左上角，AD是左侧垂直边，F必须在BE线段上）：
{
  "type": "composite",
  "points": [
    {"id": "A", "name": "A", "x": -4, "y": -3},
    {"id": "B", "name": "B", "x": 4, "y": -3},
    {"id": "C", "name": "C", "x": 4, "y": 3},
    {"id": "D", "name": "D", "x": -4, "y": 3},
    {"id": "E", "name": "E", "x": -4, "y": -1},
    {"id": "F", "name": "F", "x": 2.59, "y": -2.65}
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

输出（注意：O在原点，OA沿Y轴正方向，A在Y轴上，B在第一象限）：
{
  "type": "composite",
  "points": [
    {"id": "O", "name": "O", "x": 0, "y": 0},
    {"id": "A", "name": "A", "x": 0, "y": 3},
    {"id": "B", "name": "B", "x": 1.732, "y": 3},
    {"id": "C", "name": "C", "x": 3, "y": 2.598}
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

    const geometrySignals = detectGeometrySignals(text);
    const passesGeometryGate = isLikelyGeometryText(text, subject);
    console.log('Geometry gate result:', passesGeometryGate, 'Signals:', geometrySignals);

    if (!passesGeometryGate) {
      console.log('Geometry gate rejected text, returning empty unknown geometry');
      return NextResponse.json({
        success: true,
        geometry: EMPTY_GEOMETRY(),
      });
    }

    if (!hasGeometryContent) {
      console.log('No geometry keywords found, returning unknown');
      return NextResponse.json({
        success: true,
        geometry: buildFallbackGeometry(text),
      });
    }

    const apiKey = process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      console.error('Geometry API: No AI API key configured');
      return NextResponse.json({
        success: true,
        geometry: buildFallbackGeometry(text),
        error: 'AI service unavailable, returned fallback geometry.',
      });
    }

    // 调用AI解析几何图形
    console.log('Calling AI for geometry parsing...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(AI_URL, {
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
        signal: controller.signal,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        console.warn(`Geometry AI request timed out after ${AI_REQUEST_TIMEOUT_MS}ms, using fallback`);
        return NextResponse.json({
          success: true,
          geometry: buildFallbackGeometry(text),
          error: `AI parse timeout after ${AI_REQUEST_TIMEOUT_MS}ms, returned fallback geometry.`,
        });
      }
      throw error;
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI parse error:', response.status, errorText);
      return NextResponse.json({
        success: true,
        geometry: buildFallbackGeometry(text),
        error: `AI parse failed (${response.status}), returned fallback geometry.`,
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    console.log('AI response content:', content.substring(0, 500));

    try {
      const geometry = parseGeometryContent(content);
      if (!geometry) {
        throw new Error('No JSON object found in AI response');
      }
      console.log('Parsed geometry type:', geometry.type);
      return NextResponse.json({
        success: true,
        geometry,
      });
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message, 'Content:', content.substring(0, 500));
      return NextResponse.json({
        success: true,
        geometry: buildFallbackGeometry(text),
        error: `Geometry JSON parse failed: ${parseError.message}. Returned fallback geometry.`,
      });
    }

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
