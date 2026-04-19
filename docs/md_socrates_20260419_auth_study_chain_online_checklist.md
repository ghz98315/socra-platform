# Socrates 统一账号多 Profile 联调清单

- 更新时间：2026-04-19
- 当前目标：把原来的“家长账号 / 孩子账号”切换模型，收敛为“同一登录账号下多个 profile”
- 本轮范围：`auth / select-profile / family / students / error-book / review / study / variants`

## 一、改造目标确认

- 一个登录账号只对应一个认证身份。
- 登录账号下可以有多个 profile。
- 家长本人是账号 owner profile。
- 家长可在账号下挂 0 到多个孩子 profile。
- 切换身份不再修改数据库里的 `profiles.role`。
- 进入学生链路时，以当前激活的孩子 profile 作为 `student_id` 来源。
- 新增孩子默认只创建 profile，不强制创建独立手机号和密码。

## 二、登录与身份选择

### A1. 家长账号登录

- [ ] 家长手机号验证码登录成功。
- [ ] 家长密码登录成功。
- [ ] 登录后进入 `/select-profile`，而不是直接落到学生页。
- [ ] 身份选择页能看到“家长本人 profile”。
- [ ] 身份选择页能看到该账号下所有孩子 profile。
- [ ] 点击家长 profile 后进入 `/tasks`。
- [ ] 点击某个孩子 profile 后进入 `/study/math/problem`。

### A2. 学生账号兼容

- [ ] 独立学生账号登录后，不需要选择页，直接进入学生学习页。
- [ ] 独立学生账号进入 `/select-profile` 时，不出现异常死循环。

### A3. 退出与再次登录

- [ ] 在 `/select-profile` 右上或底部退出登录可正常返回 `/login`。
- [ ] 退出后再次登录，不会残留上一次其他账号的激活 profile。
- [ ] 同一账号再次登录后，能恢复上一次激活的 profile。

## 三、家长侧联调

### B1. 家长 profile 进入家长工作台

- [ ] 家长 profile 进入 `/tasks` 正常。
- [ ] 家长 profile 进入 `/family` 正常。
- [ ] 家长 profile 进入家长报告、监管、任务相关页面正常。
- [ ] 家长 profile 访问学生专属路由时，会引导到 `/select-profile` 或正确跳转。

### B2. 家庭页与孩子 profile

- [ ] `/family` 页面文案已体现“统一账号 + 孩子 profile”。
- [ ] 家庭页能拉取当前家长名下的孩子 profile 列表。
- [ ] 新增孩子后，只创建 profile，不要求输入独立密码。
- [ ] 新增孩子后，重新进入 `/select-profile` 能看到新孩子。
- [ ] 删除孩子 profile 后，`/select-profile` 不再出现该孩子。
- [ ] 老数据里若孩子曾有独立 auth 账号，现有列表仍可正常展示。

## 四、学生侧联调

### C1. 孩子 profile 进入学习链路

- [ ] 从选择页切到某个孩子后，可正常进入 `/study/math/problem`。
- [ ] `/error-book` 列表只显示当前孩子的数据。
- [ ] `/error-book/[id]` 详情只展示当前孩子可访问的题目。
- [ ] `/review` 只展示当前孩子的复习记录。
- [ ] `/workbench`、学习资产、错题详情导出等学生页面不报错。

### C2. 孩子 profile 取数隔离

- [ ] 家长账号切到孩子 A 后，学生页数据全部来自孩子 A。
- [ ] 再切到孩子 B 后，学生页数据切换为孩子 B，不残留孩子 A 数据。
- [ ] 刷新页面后，仍保持当前激活的孩子 profile。
- [ ] 直接访问学生页深链时，不会丢失当前激活 profile。

### C3. 学习时长与青少年模式

- [ ] 当前激活孩子进入学生页后，青少年模式按该孩子配置读取。
- [ ] 使用时长上报写入当前激活孩子的 `user_id / student_id`。
- [ ] 切换到另一个孩子后，剩余时长与当日时长同步切换。

## 五、错题链路联调

### D1. 错题会话与收口

- [ ] 孩子 profile 发起新错题会话成功。
- [ ] 会话消息保存完整，不会只保存少量对话。
- [ ] 收口弹窗能正常出现，不无限 loading。
- [ ] 提交到错题库后，本次对话结束逻辑正常。

### D2. 错题详情

- [ ] 从错题本进入详情无乱码。
- [ ] “看原题”文案与加载提示无乱码。
- [ ] 变式练习区域已在对话记录上方。
- [ ] 返回原题、继续复习、查看对话记录链路正常。

## 六、复习与变式联调

### E1. 复习链路

- [ ] 当前激活孩子可以正常生成复习计划。
- [ ] 复习页面能按当前孩子拉取待复习记录。
- [ ] 完成一次复习后，艾宾浩斯节奏推进正常。

### E2. 变式链路

- [ ] 错题详情页可以正常生成变式题。
- [ ] 生成变式后按钮不会一直 loading。
- [ ] 重新生成变式时状态可恢复，不报 JSON 解析错误。
- [ ] 几何题当前只做“变题干”，不再依赖“变图形”。
- [ ] 原题图片可作为静态图片随题干一起保留展示。

## 七、服务端授权联调

### F1. 当前激活 profile 授权

- [ ] 家长切到孩子后，学生接口无需手输 `student_id` 也能按当前孩子工作。
- [ ] 直接带 `student_id` 请求接口时，仍会校验必须属于该家长。
- [ ] 不属于当前家长的孩子数据返回 `403` 或 `404`。

### F2. 重点接口抽查

- [ ] `GET /api/account/profile`
- [ ] `PATCH /api/account/profile`
- [ ] `GET /api/students`
- [ ] `POST /api/students/add`
- [ ] `DELETE /api/students/[studentId]`
- [ ] `GET /api/error-book`
- [ ] `GET/POST/PATCH /api/error-session`
- [ ] `GET/POST /api/review/schedule`
- [ ] `GET/POST /api/study/session`
- [ ] `GET/POST/PATCH /api/study/assets`
- [ ] `GET/POST/PATCH /api/variants`

## 八、异常场景

- [ ] 家长账号下没有孩子 profile 时，选择页仍可正常进入家长侧。
- [ ] 当前激活孩子被删除后，刷新页面不会白屏。
- [ ] cookie 中保留了失效 profile id 时，系统会自动回退到账号 owner profile。
- [ ] 旧学生独立账号仍可登录，不被本轮改造破坏。
- [ ] 任一接口报错时，不出现 `Unexpected token '<'` 这类前端误解析报错。

## 九、构建校验

- [x] `pnpm.cmd --filter @socra/socrates build`

## 十、上线后优先回归

- [ ] 家长登录
- [ ] 选择家长 / 孩子 profile
- [ ] 孩子错题对话
- [ ] 提交错题库
- [ ] 错题详情
- [ ] 复习
- [ ] 变式生成
- [ ] 家庭页新增孩子
