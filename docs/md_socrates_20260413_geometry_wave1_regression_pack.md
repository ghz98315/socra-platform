# Socrates 几何 Wave 1 统一回归执行单

- 日期：2026-04-13
- 目的：把当前高频几何题型合成一轮统一回归，避免单题零散测试
- 范围：
  - 非几何题误触发拦截
  - 圆 + 切线 / 直径
  - 矩形 / 投影 / 垂线交点
  - 坐标系中的反比例函数 + 几何组合
  - 识别失败时保留旧图

## 一、执行前命令

```powershell
pnpm.cmd socrates:status:local
```

如未启动：

```powershell
pnpm.cmd socrates:start:local
```

类型检查：

```powershell
$env:NODE_OPTIONS='--max-old-space-size=4096'
pnpm.cmd --filter @socra/socrates exec tsc --noEmit
```

## 二、统一回归顺序

建议严格按这个顺序执行：

1. 非几何题误触发拦截
2. 圆 + 切线 / 直径
3. 矩形 / 投影 / 垂线交点
4. 坐标系中的函数 + 几何组合
5. 成功识别后再触发失败，验证旧图保留

这样做的原因：
- 先确认门禁没退回
- 再看传统几何
- 再看坐标复合几何
- 最后验证恢复链路

## 三、回归用例

### Case A：非几何题不误触发

```text
已知 2x + 3 = 11，求 x 的值，并说明解方程的步骤。
```

预期：
- 不出现几何画板
- 不生成猜测图形
- 可直接继续答题

结果记录：
- [ ] 通过
- [ ] 不通过
- 备注：

### Case B：圆 + 切线 / 直径

```text
如图，AB是⊙O的直径，点C在⊙O上，过点C作⊙O的切线交AB延长线于点D，∠D=30°。
```

预期：
- 圆正常显示
- 直径 `AB` 正常显示
- 切线 `CD` 正常显示
- 半径 `OC` 正常显示
- 直角关系 `∠OCD=90°` 不丢

结果记录：
- [ ] 通过
- [ ] 不通过
- 备注：

### Case C：矩形 / 投影 / 垂线交点

```text
如图，在矩形ABCD中，E为AD边上一点，连接BE，过C作CF⊥BE交BE于点F。若BE=BC，求证：△ABE≌△FCB。
```

预期：
- `A/B/C/D/E/F` 六个点都稳定出现
- `BE`、`CF` 能正常显示
- `F` 点不漂移到错误位置
- 图形关系仍保持矩形结构

结果记录：
- [ ] 通过
- [ ] 不通过
- 备注：

### Case D：坐标系中的反比例函数 + 几何组合

原题图：

```text
D:\github\Socrates_ analysis\test_image\PixPin_2026-02-28_07-35-38.png
```

参考 OCR 文本：

```text
如图，Rt△OAB与Rt△OBC位于平面直角坐标系中，∠AOB=∠BOC=30°，BA⊥OA，CB⊥OB，若AB=√3，反比例函数y=k/x恰好经过点C，则k=______。
```

预期：
- `C` 点必须出现
- `BC`、`OC` 必须显示
- 反比例函数曲线必须经过 `C`
- 不能退化成只有 `A/B/O` 和一条曲线

结果记录：
- [ ] 通过
- [ ] 不通过
- 备注：

### Case E：识别失败时保留旧图

步骤：
1. 先用 Case B / C / D 任一题成功识别
2. 再故意删掉 OCR 中的关键条件
3. 点击重新识别

预期：
- 原画板不被清空
- 出现“已保留上一版图形”或“已保留当前图形”提示
- 用户仍可继续答题

结果记录：
- [ ] 通过
- [ ] 不通过
- 备注：

## 四、Wave 1 最小通过标准

以下全部满足才算这轮通过：

- Case A 通过
- Case B 通过
- Case C 通过
- Case D 通过
- Case E 通过

## 五、当前已知基线

- 坐标几何 `C` 点恢复基线：
  - `docs/md_socrates_20260413_coordinate_geometry_regression_baseline.md`

- 总体几何人工清单：
  - `docs/md_socrates_20260413_geometry_manual_regression_checklist.md`

- 下一轮优先级：
  - `docs/md_socrates_20260413_geometry_next_wave_plan.md`
