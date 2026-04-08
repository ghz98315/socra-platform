# 书页面与书稿进度备忘

保存时间：2026-04-08 17:35:24 +08:00

## 当前主线状态

- 书页面标题层级调整后，最新已推送提交：`6806ac5` - `Refine book title hierarchy`
- 上一个相关提交：`2440dea` - `Add bookface3 preview asset`
- 当前工作分支：`main`

## 已完成的页面工作

- `/book` 页面和首页书籍区块已经调整为参考 `bookface3` 的标题层级。
- 主标题为视觉主导：`从错误开始`
- 页面标题中的冒号已去掉。
- `/book` 页说明语已改为：
  - `不是提分技巧，不是管理工具，而是一种面对错误的系统思维方式。`

## 第 11 章导入进度

- 用户提供的两份章节源稿：
  - `book/ch11_01.html`
  - `book/ch11_02.html`
- 已整合生成正式章节源文件：
  - `book/ch11.html`
- 第 11 章标题已统一为：
  - `最难熬的那三周——让这套系统真正扎根`
- 章节头已统一为全书风格：
  - `第十一章 · 器`
- 阅读器已补齐第 11 章使用到的版式类：
  - `scene-block`
  - `week-timeline`
  - `approach-compare`
  - `rule-cards`
  - `signal-list`
  - `case-handwriting`
  - `summary-block`
  - `no-break-block`
- 已执行导入命令：
  - `pnpm.cmd book:import`
- 自动生成 registry 已包含 `ch11`：
  - `apps/landing/lib/generated/bookChapterRegistry.generated.ts`
- 已执行并通过构建验证：
  - `pnpm --filter @socra/landing build`

## 本次相关文件

- `book/ch11.html`
- `book/ch11_01.html`
- `book/ch11_02.html`
- `apps/landing/app/reader.css`
- `apps/landing/lib/generated/bookChapterRegistry.generated.ts`
- `docs/md_progress_book_20260408.md`

## 当前仍保留、未处理的无关脏文件

- 已修改：
  - `apps/landing/components/BookCoverMockup.tsx`
  - `apps/landing/vercel.json`
  - `book/bookface.png`
  - `pnpm-lock.yaml`
  - `pnpm-workspace.yaml`
- 未跟踪：
  - `apps/socrates-landing-page (2).zip`
  - `book/bookface01.png`
  - `book/bookface02.png`
  - `book/facecode.md`
  - `book/logo.md`
  - `book/total_book.html`

## 下次继续的提示词

```text
继续 socra-platform 的书稿导入和页面收尾工作。当前主线在书页面标题层级调整之后，又完成了第 11 章导入准备。

请先基于以下状态继续：
1. `/book` 页面和首页书籍区块已经按 `bookface3` 的效果改成“主标题为主、副标题辅助”的层级。
2. `/book` 页说明语已经改为“不是提分技巧，不是管理工具，而是一种面对错误的系统思维方式。”
3. 第 11 章的两份源稿是：
   - book/ch11_01.html
   - book/ch11_02.html
4. 已经生成正式章节文件：
   - book/ch11.html
5. 已经补过阅读器样式：
   - apps/landing/app/reader.css
6. 已经跑通过：
   - pnpm.cmd book:import
   - pnpm --filter @socra/landing build
7. 自动生成 registry 已包含 ch11：
   - apps/landing/lib/generated/bookChapterRegistry.generated.ts
8. 仓库里还有一些与当前主线无关的脏文件，不要误删或回滚：
   - apps/landing/components/BookCoverMockup.tsx
   - apps/landing/vercel.json
   - book/bookface.png
   - pnpm-lock.yaml
   - pnpm-workspace.yaml
   - apps/socrates-landing-page (2).zip
   - book/bookface01.png
   - book/bookface02.png
   - book/facecode.md
   - book/logo.md
   - book/total_book.html

继续前先检查当前 git 状态和线上效果，只在用户明确要求的范围内推进。
```
