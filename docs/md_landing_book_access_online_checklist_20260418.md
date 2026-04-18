# Landing 书籍权限线上联调清单

日期：2026-04-18

## 目的

验证 `landing` 与 `socrates` 的阅读权限链路已经闭环：

- 免费用户只能阅读前言、第 1 章、第 2 章
- 付费用户进入 `landing` 后可自动解锁完整版章节
- 付费章节不能通过直链或接口绕过

## 联调前提

1. 线上已部署本次代码
2. `landing` 与 `socrates` 使用同一套 Supabase 环境变量
3. 建议先退出并重新登录一次 `socrates`
4. 若线上配置了共享 cookie 域，建议确认 `NEXT_PUBLIC_SHARED_AUTH_COOKIE_DOMAIN=.socra.cn`

说明：

- 这次新增了跨子域会话共享逻辑
- 老的登录 cookie 不一定带共享域属性
- 不重新登录，`landing` 可能识别不到最新会话

## 用例 A：未登录用户

1. 打开 `https://www.socra.cn/book`
2. 确认页面提示“当前开放免费阅读：前言、第 1 章、第 2 章”
3. 点击前言，确认可以进入阅读页
4. 点击第 1 章，确认可以进入阅读页
5. 点击第 2 章，确认可以进入阅读页
6. 点击第 3 章，确认跳转到购买页
7. 点击尾声或附录，确认跳转到购买页

预期：

- 免费章节可读
- 非免费章节全部被锁定
- 目录中非免费章节显示锁状态

## 用例 B：已登录但无付费权限用户

1. 登录一个普通账号
2. 打开 `https://www.socra.cn/book`
3. 确认仍显示免费提示，而不是“已自动解锁”
4. 重复点击第 3 章、尾声、附录

预期：

- 表现与未登录一致
- 不能因为已有账号就读到完整版

## 用例 C：已登录且有付费权限用户

1. 登录一个有 Pro 权限的账号
2. 打开 `https://www.socra.cn/book`
3. 确认页面提示“已识别当前账号为付费用户，完整版章节已自动解锁”
4. 确认目录中原锁定章节显示“已解锁”或可直接进入
5. 点击第 3 章、第 8 章、尾声、附录
6. 在阅读页使用上一章、下一章、目录跳转

预期：

- 付费章节都能直接打开
- 阅读页内前后翻章不再被锁逻辑打断
- 目录弹层中完整版章节可直接跳转

## 用例 D：付费章节直链拦截

1. 未登录状态直接打开 `https://www.socra.cn/read/ch3`
2. 未登录状态直接打开 `https://www.socra.cn/read/epilogue`
3. 普通账号状态重复上述操作
4. Pro 账号状态重复上述操作

预期：

- 未登录和普通账号都被重定向到购买页
- Pro 账号可以正常进入

## 用例 E：接口防绕过

1. 未登录访问 `https://www.socra.cn/api/book-source/ch3`
2. 普通账号访问 `https://www.socra.cn/api/book-source/ch3`
3. Pro 账号访问 `https://www.socra.cn/api/book-source/ch3`

预期：

- 未登录和普通账号返回 `403`
- Pro 账号返回章节 JSON
- JSON 中应包含 `chapterId`、`sourcePath`、`content`

## 用例 F：免费章节接口

1. 未登录访问 `https://www.socra.cn/api/book-source/prologue`
2. 未登录访问 `https://www.socra.cn/api/book-source/ch1`
3. 未登录访问 `https://www.socra.cn/api/book-source/ch2`

预期：

- 均可返回正文 JSON

## 用例 G：跨子域会话同步

1. 在 `https://socrates.socra.cn/login` 登录 Pro 账号
2. 不关闭浏览器，直接打开 `https://www.socra.cn/book`
3. 如未识别权限，退出后重新登录再试

预期：

- 正常情况下应自动识别为付费用户
- 如果第一次不生效，重新登录后应生效

## 当前权限口径

免费开放：

- `prologue`
- `part1-cover`
- `ch1`
- `ch2`

付费锁定：

- `ch3` 起全部章节
- `epilogue`
- `appendix`
- `part2-cover`
- `part3-cover`
- `part4-cover`

## 下一阶段建议

当前线上逻辑仍然是：

- `Pro active subscription = 完整版阅读权限`

下一步建议补独立权益模型：

- 新增 `book_entitlements` 或等价表
- 购书后写入永久阅读权限
- `landing` 阅读权限改为 `book entitlement OR pro`
- 这样才能严格兑现“电子书永久阅读权益”
