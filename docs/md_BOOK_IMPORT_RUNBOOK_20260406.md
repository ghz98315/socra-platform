# Book 章节批量导入说明

日期：2026-04-06
适用范围：`socra-platform / apps/landing / book`

## 1. 目标

把 `book/` 目录下已经写完的章节 HTML，批量收口成 landing 阅读器和后台共用的一套文件源注册表。

当前流程的设计原则：

- `book/*.html` 是章节正文源文件
- 阅读器和后台都只认导入后生成的 registry
- 未完成的章节不导入，不提前接入
- 不把正文再复制一份回 `useBookChapters.ts`

## 2. 当前已纳入批量导入的章节

导入命令当前会自动扫描：

- `book/ch8.html`
- `book/ch9.html`
- `book/ch10.html`

当前不会导入：

- `ch11`

原因：`book/ch11.html` 目前不存在，章节正文还未定稿。等文件完成后，再执行一次导入命令即可自动纳入。

## 3. 导入命令

在仓库根目录执行：

```powershell
pnpm.cmd book:import
```

对应脚本：

- `scripts/import-book-chapters.mjs`

脚本会做三件事：

1. 扫描 `book/` 目录下所有匹配 `ch*.html` 的章节文件
2. 校验每个文件都包含 `<article class="chapter">...</article>` 正文块
3. 生成注册表文件：
   `apps/landing/lib/generated/bookChapterRegistry.generated.ts`

## 4. 导入产物

导入后会生成：

- `apps/landing/lib/generated/bookChapterRegistry.generated.ts`

该文件是自动生成文件，不应手改。

当前业务代码通过以下模块使用它：

- `apps/landing/lib/bookChapterRegistry.ts`
- `apps/landing/lib/bookChapterSource.ts`
- `apps/landing/app/read/[chapterId]/page.tsx`
- `apps/landing/app/api/book-source/[chapterId]/route.ts`
- `apps/landing/components/AdminPageClient.tsx`

## 5. 正确的后续接入步骤

以后新增一章，例如 `ch11`，按下面流程处理：

1. 先完成源文件：`book/ch11.html`
2. 确认正文块已经写在 `<article class="chapter">...</article>` 内
3. 运行：`pnpm.cmd book:import`
4. 再运行：`pnpm --filter @socra/landing build`
5. 验证：
   - `/read/ch11` 是否读取到真实正文
   - `/admin` 中该章节是否显示为“文件源”
   - 后台是否能读取正文但保持只读

## 6. 后台行为说明

对于通过 `book:import` 纳入 registry 的章节：

- 后台会显示 `文件源` 标记
- 后台点击后会读取真实正文内容
- 正文编辑框只读
- 后台不会允许删除这类章节

这样做是为了避免两套 source of truth：

- 阅读器读 `book/*.html`
- 后台却改 `useBookChapters.ts` 内嵌正文

## 7. 常见问题

### 7.1 为什么不直接把 HTML 复制回 `useBookChapters.ts`

因为会出现正文双写：

- 一份在 `book/*.html`
- 一份在 `useBookChapters.ts`

后续任何修订都容易漏改，最终前后台内容漂移。

### 7.2 为什么 `ch11` 现在不导入

因为导入流程以文件存在为准，不以目录占位为准。

现在只有：

- `ch8.html`
- `ch9.html`
- `ch10.html`

所以当前 registry 只会生成这三章。

### 7.3 如果导入命令失败，先检查什么

优先检查：

- 文件名是否为 `ch数字.html`
- HTML 是否包含 `<article class="chapter">...</article>`
- 文件编码是否为 UTF-8
- 命令是否在仓库根目录 `socra-platform` 下执行

## 8. 建议执行顺序

每次书稿更新，建议固定按这个顺序：

1. 修改 `book/chX.html`
2. 运行 `pnpm.cmd book:import`
3. 运行 `pnpm --filter @socra/landing build`
4. 在 `/read/chX` 和 `/admin` 双侧核对

## 9. 当前结论

当前 `book` 目录这套源已经收口成批量导入流程。

后续只要新章节文件实际落到 `book/`，就不需要再手工维护 file-backed registry，只需要重复执行同一条导入命令。
