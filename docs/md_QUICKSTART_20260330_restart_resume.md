# Restart Resume Prompt

Date: 2026-04-02

```text
你现在接手的是本机仓库的最新节点，请先不要假设旧上下文，先按下面要求核对并继续工作。

项目路径：
D:\github\Socrates_ analysis\socra-platform

工作要求：
1. 先读取 git 与 docs，确认当前节点、分支、最新提交、未提交状态
2. 以仓库当前最新已推送节点为准继续开发，不要回退到旧文档或旧方案
3. 不需要我手工确认的步骤直接执行
4. 优先参考 docs 里的主文档，不要从已清理的冗余文档开始
5. 不要改动其他项目架构，只在当前需求范围内推进
6. 如果发现自定义域名和 vercel alias 结果不一致，优先区分 Cloudflare / 域名链路问题 和 应用本身问题，不要单机误判为应用回归

启动后先执行：
- git status
- git log -1
- 阅读以下主文档：
  - docs/md_README_DOCS.md
  - docs/md_progress_socrates.md
  - docs/md_RELEASE_RUNBOOK.md
  - docs/md_deployment_cn.md
  - docs/md_TEST_GUIDE.md
  - docs/md_socrates_auth_joint_debug_20260402.md
  - docs/md_socrates_full_test_execution_20260402.md

然后先给我一段简短结论，必须包含：
1. 当前是否就在最新节点
2. 当前分支和最新提交号
3. 当前是否有未提交改动
4. 你接下来准备做什么

当前已知关键背景：
- 分支：main
- 当前最新已推送提交应为：f847cf2
- 提交信息：Save landing refresh and auth phase 1 progress
- landing 改版资料、auth phase 1、相关 docs 和 supabase migrations 已保存并 push
- `socra-socrates` 是唯一有效的 Socrates 正式 Vercel 项目
- `socrates.socra.cn` 的异常优先按 Cloudflare / 自定义域名链路处理
- 某些机器对 `*.vercel.app` 或自定义域名可能存在 DNS / TLS / 网络路径异常，不能单机直接判定为应用回归

当前阶段重点：
- Socrates 手机验证码登录/注册 Phase 1 已完成一轮联调、构建、部署与验证
- 本地 `pnpm smoke:auth-phone` 已通过
- `https://socra-platform.vercel.app/api/auth/send-code` 已验证成功
- 如果 `socrates.socra.cn` 仍异常，优先继续做域名链路诊断
- 如果进入功能测试，按 `docs/md_socrates_full_test_execution_20260402.md` 执行

输出风格要求：
- 先核对，再行动
- 结论简洁明确
- 不要复述一大段历史，只提取最新有效进度
- 如果继续开发，直接进入下一步，不要停在分析
```
