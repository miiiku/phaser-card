# 抽卡卡牌游戏

基于 Vue 3、PixiJS 8、GSAP 与 Spine 4.3 Runtime 的浏览器抽卡游戏。

当前阶段已完成项目初始化、游戏基础架构，以及全屏 Pixi 主场景接入。

## 开发命令

```bash
pnpm install
pnpm dev           # 启动开发服务器（不做类型检查）
pnpm type-check    # 仅做 TypeScript 类型检查
pnpm build         # 先类型检查，再打包
pnpm build-only    # 跳过类型检查直接打包
pnpm preview
```

## 目录结构

```text
src/
├── assets/                 Vue/HTML 界面资源与全局样式
├── components/             Vue 容器与 Pixi 生命周期接入
└── game/
    ├── animation/          GSAP 与 PixiPlugin 初始化
    ├── config/             玩法常量
    ├── core/               Pixi Application 等引擎基础设施
    ├── data/               卡组和卡牌静态配置
    ├── features/           抽卡、卡组、合成、结算、图鉴等玩法模块
    ├── scenes/             Pixi 游戏场景
    ├── services/           游戏局 API 与断线恢复边界
    ├── spine/              Spine 资源注册与实例创建
    └── state/              游戏局状态与状态机

public/game/
├── audio/                  音效与音乐
├── cards/                  卡牌贴图与分层资源
├── decks/                  卡组背景与主题资源
└── spine/                  Spine skeleton、atlas 与纹理
```

## TypeScript 约定

- 项目使用 TypeScript（`strict`）编写，Vue 组件统一使用 `<script setup lang="ts">`。
- 配置文件拆分为 `tsconfig.app.json`（`src/` 与组件）与 `tsconfig.node.json`（`vite.config.ts`），由根 `tsconfig.json` 通过 project references 组合。
- 路径别名 `@/*`、`@game/*` 在 `tsconfig.app.json` 与 `vite.config.ts` 中保持一致；新增别名时两边都要改。
- 导入本地模块不写扩展名（如 `./assetAliases`），由 Vite 解析。
- 仅用于类型的内容使用 `import type` / `export type`（`verbatimModuleSyntax` 已开启）。

## 架构约束

- 服务端先确定开奖结果、效果、合成、结算和图鉴奖励，客户端只负责播放结果。
- 游戏局状态机是抽卡流程的唯一阶段来源，避免重复抽卡、结算和发奖。
- Spine 导出资源应与 Runtime 保持 4.3 版本兼容。
- `src/game/index.ts` 是游戏层公共入口；界面接入时从这里按需引入。
