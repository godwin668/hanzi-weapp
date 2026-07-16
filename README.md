# 汉字练字

基于 Taro + React 的汉字书写学习微信小程序，面向小学生群体，提供自由书写、描红临摹、测试评分等练字功能。

## 功能模块

- **自由书写** — 选择汉字自由练习
- **描红临摹** — 按笔顺描红，辅助笔画学习
- **测试模式** — 脱离提示独立书写并评分
- **记录查看** — 练习历史和评分记录

## 技术栈

- Taro 4.x + React 18 + TypeScript
- 微信云开发（CloudBase）
- Zustand 状态管理
- hanzi-writer-data 笔画数据

## 快速开始

```bash
# 安装依赖
npm install

# 微信小程序（自动编译）
npm run dev:weapp

# H5 网页版（自动编译）
npm run dev:h5
```

## 导入微信开发者工具

1. 运行 `npm run dev:weapp` 启动自动编译
2. 打开微信开发者工具 → 导入项目 → 选择本项目根目录
3. `project.config.json` 已配置 `miniprogramRoot: "dist/"`，工具会自动识别

## 编译命令

| 命令 | 说明 |
|------|------|
| `npm run dev:weapp` | 微信小程序监听模式（**推荐**，改代码自动编译） |
| `npm run dev:h5` | H5 监听模式 |
| `npm run build:weapp` | 微信小程序一次性编译 |
| `npm run build:h5` | H5 一次性编译 |

## 常见问题

**Q: 每次改代码都要重新编译吗？**
使用 `dev:weapp` 监听模式会自动编译，无需手动操作。

**Q: 云开发功能不可用？**
需要在微信小程序后台开通云开发并绑定环境 ID，开通前会自动降级为本地 mock 数据。
