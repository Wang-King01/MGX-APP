---
last_updated: 2026-09-15T12:10:39Z
---

# Architecture Design

## System Overview
采用已初始化的 React + Vite 前端与 Atoms Cloud 分离架构。本轮为浏览器本地交互 Demo，不要求账号、真实报名、实时天气或公开发布。

## Tech Stack
React 18、TypeScript、Vite、Tailwind CSS、Radix Dialog、Lucide、Sonner；Atoms Cloud 基础能力已启用，本轮无运行时后端调用。

## Module Design
| Module | Responsibility | Key Files |
|--------|---------------|-----------|

## Tech Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|

## File Tree Plan
- `src/pages/Index.tsx`：首页、搭子广场、手记、收藏及活动详情侧栏。
- `src/explore-data.ts`：演示活动、队伍和本地状态读取。
- `src/index.css`：蜂蜜金响应式界面。


## Implementation Guide

