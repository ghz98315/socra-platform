# Socrates 坐标几何回归基线

- 日期：2026-04-13
- 目的：固化“反比例函数 + 坐标系中的直角三角形”题型，避免后续再次出现 `C` 点缺失、线段缺失、曲线不过 `C` 的回退。

## 样例来源

- 原题图片：`D:\github\Socrates_ analysis\test_image\PixPin_2026-02-28_07-35-38.png`
- 相关验收反馈：
  - 初始问题：`C` 点未识别出来，导致相关线段未显示
  - 修复后结果：用户确认“出来了”

## 题型特征

题干关键结构：

```text
Rt△OAB 与 Rt△OBC 位于平面直角坐标系中
∠AOB = ∠BOC = 30°
BA ⊥ OA
CB ⊥ OB
反比例函数 y = k/x（或等价写法）恰好经过点 C
```

这是一个高风险组合题型，因为它同时包含：
- 坐标系
- 两个直角三角形
- 反比例函数图像
- 函数与几何点 `C` 的绑定关系

## 本轮修复点

本轮代码在 `apps/socrates/app/api/geometry/route.ts` 做了两层兜底：

1. 缺线补全
- 当 AI 已输出点、角、关系、条件，但 `lines` 不完整时
- 自动从 `angles / relations / conditions` 补出可渲染线段

2. 专项题型恢复
- 当题目命中“Rt△OAB + Rt△OBC + 反比例函数经过 C”结构时
- 如果解析结果缺 `C` 点，或缺关键线段
- 直接按题意恢复：
  - 点：`O / A / B / C`
  - 线段：`OA / AB / OB / BC / OC`
  - 曲线：反比例函数，并绑定经过 `C`

## 最小验收标准

这个题型后续每次回归至少确认以下 4 项：

1. `C` 点必须出现
2. `BC` 和 `OC` 必须能画出来
3. 反比例函数曲线必须经过 `C`
4. `O / A / B / C` 的几何结构不能塌成只有函数图像和两个点

## 推荐复测方式

优先使用原题图或等价 OCR 文本做回归。

可参考 OCR 文本：

```text
如图，Rt△OAB与Rt△OBC位于平面直角坐标系中，∠AOB=∠BOC=30°，BA⊥OA，CB⊥OB，若AB=√3，反比例函数y=k/x恰好经过点C，则k=______。
```

## 当前关联提交

- `4c4bb67` `fix(socrates): complete missing geometry lines for rendering`
- `613f243` `fix(socrates): recover missing C point in coordinate geometry`
