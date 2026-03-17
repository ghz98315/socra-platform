# Node 20 切换指南

日期：2026-03-17

## 当前状态

- 仓库 `package.json` 要求 `node: 20.x`
- 当前机器实测为 `Node v22.19.0`
- 当前 `@socra/socrates` 构建可以通过，但会持续出现 engine warning

## 仓库内已补的约束

- 根目录已新增 `.nvmrc`
- 根目录已新增 `.node-version`
- 两个文件都声明为 `20`

## Windows 推荐方案

优先使用 `nvm-windows` 管理 Node 版本，不建议直接反复卸载重装 Node。

### 1. 安装 nvm-windows

如果尚未安装：

- 下载安装 `nvm-windows`
- 安装完成后，重新打开 PowerShell

### 2. 查看可安装版本

```powershell
nvm list available
```

建议安装稳定的 `20.x` 版本，例如 `20.19.0` 或之后同系列补丁版本。

### 3. 安装并切换

```powershell
nvm install 20.19.0
nvm use 20.19.0
node -v
```

预期输出类似：

```powershell
v20.19.0
```

### 4. 回到项目验证

```powershell
cd "D:\github\Socrates_ analysis\socra-platform"
pnpm --filter @socra/socrates build
```

## 如果当前没有 nvm

当前会话未检测到以下命令：

- `nvm`
- `fnm`
- `volta`

因此建议先装 `nvm-windows`，不要继续长期使用 `Node 22` 作为默认版本跑该仓库。

## 最小执行清单

```powershell
nvm install 20.19.0
nvm use 20.19.0
node -v
cd "D:\github\Socrates_ analysis\socra-platform"
pnpm --filter @socra/socrates build
```
