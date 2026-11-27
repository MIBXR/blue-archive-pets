# 响与时的宣传网站（千禧年桌宠图鉴）

全站以 **昼夜双生四幕满屏剧场** 组织：白昼为冰白钴蓝底纸的 **猫冢响 · 拉拉队服**，黑夜为无色相深炭灰底 + 星空蓝斜切卡的 **飞鸟马时 · 兔女郎**。桌面端通过右侧同步滚号章节栏、滚轮或方向键在「角色舞台 / 学生手记 / MomoTalk / 桌面领回」四幕间水平互补裁切切换；移动端（`≤ 900px`）自动转为自然纵向流，并保持人物舞台 `760 / 568` 等比不变形。

- [千禧年桌宠图鉴（入口）](https://blue-archive-pets.mibxranime.chatgpt.site/)
- [白昼 · 猫冢响](https://blue-archive-pets.mibxranime.chatgpt.site/?pet=hibiki)（兼容旧入口 `hibiki.html`）
- [黑夜 · 飞鸟马时](https://blue-archive-pets.mibxranime.chatgpt.site/?pet=toki)（兼容旧入口 `toki.html`）

使用 Sites 托管；当前可公开访问。网站源码保存在本目录，无需框架或构建步骤。

## 本地查看

首次从 Git 克隆后，在此目录依次执行：

```bash
python tools/prepare-hd.py
node tools/prepare-downloads.mjs
python -m http.server 4177
```

首条命令需要 Python 3.10+、Pillow 和 NumPy，从仓库中已保存的原稿生成相同字节的透明高清素材；第二条从固定 Release 获取两份已有便携包并核对 SHA-256。浏览器打开 `http://localhost:4177/`。用 HTTP 打开以加载模块、音频和 JSON。

原稿保存在 `pets/`；程序生成的 `motion-hd/*.png` 和重复的 Release ZIP 不再写入 Git，处理脚本、每帧注册信息、官方图鉴素材（`assets/official/`）与 5 首 128k 原声 BGM（`assets/audio/`）保存在 Git。Sites 部署和完整交付包均已包含生成文件，可直接使用。

## 交互与功能

- **昼夜单刀斜切与 URL 持久化**：使用原生 `document.startViewTransition()` 单次斜切揭示切换昼夜模式，并自动同步 `?pet=hibiki` / `?pet=toki`，刷新或分享直达不掉角色；后台静默预加载立绘、高清动作长条与 BGM。
- **第 1 幕 · 角色舞台**：9 种日常动作、16 方向指针/键盘跟随、响的「六拍应援节拍轨」（第 5 拍迸发蓝黄星芒）与时的「360° 光学锁定环」（扫满一圈送达「白垩之预告状」并常驻重开入口）。
- **第 2 幕 · 学生手记**：背景故事、记忆大厅与招牌动作预览，内置默认关闭的「工程红线规格透视」开关，按 `manifest.json` 实际像素坐标标出 `Y=460` 基准线与 `340px` 主体卡尺。
- **第 3 幕 · MomoTalk**：三轮分支对话与右侧 Live Channel 桌宠实时动作响应，右上角追踪 3 格羁绊进度，聊满解锁并拆开角色专属隐藏附言。
- **第 4 幕 · 桌面领回 & 快速下载终端**：完整 64 位 SHA-256、ZIP 直下与 Agent 一键安装指令，支持把左侧动态小桌宠直接拖入右侧安装色块切换目标；顶栏「快速下载」提供斜切双栏派遣弹窗。
- **原声 BGM 与背景氛围**：顶栏内嵌 5 首官方原声 BGM 弹出选曲器（默认静音，不自动扰民）；底层附极轻背景星尘与指针轻避让工程点阵，换章时全程连续不被遮挡，系统开启「减少动态效果」时自动静止。

## 动作渲染与安装规范

动作优先使用 `assets/motion-hd/` 透明高清原稿，正式 sprite v2 图集（`1536 × 2288`，单格 `192 × 208`）作为加载失败时的自动回退，二者共享 `520 × 520` 舞台、可见身高与基线。

复制安装指令只会复制可查看的文字。指令先确定用户指定或当前 Agent 的安装目标：支持 sprite v2 的 Codex 使用 `$CODEX_HOME/pets/<slug>/`（默认 `~/.codex/pets/<slug>/`）；其他 Agent 使用已确认的兼容宠物目录；没有适用 Agent 或仅支持 v1 时，使用 `~/.petdex/pets/<slug>/`。完整校验值见 `downloads/agent-install.json`。

目录与本地配置依据：[Codex pet contract](https://github.com/openai/skills/blob/main/skills/.curated/hatch-pet/references/codex-pet-contract.md)、[Petdex CLI](https://github.com/crafter-station/petdex/blob/main/packages/petdex-cli/README.md)。

## 验证截图

新版实机预览截图保存在 `assets/previews/`：

- [白昼 · 猫冢响主舞台](assets/previews/hibiki-desktop.png) · [手机端（昼）](assets/previews/hibiki-mobile.png)
- [黑夜 · 飞鸟马时主舞台](assets/previews/toki-desktop.png) · [手机端（夜）](assets/previews/toki-mobile.png)
- [学生手记 · 响工程红线透视](assets/previews/hibiki-motion.png) · [学生手记 · 时转椅红线透视](assets/previews/toki-chair.png)
- [MomoTalk 互动频道](assets/previews/momotalk-desktop.png) · [桌面领回与拖入式安装台](assets/previews/deploy-desktop.png)
