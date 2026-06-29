# 青岛风向标航空科技企业宣传网站 — 内容编辑指南

> 本网站采用**内容与代码完全分离**设计。  
> 日常更新只需修改以下 4 个文件，无需动任何代码。

---

## 目录结构

```
fengxiangbiao-website/
├── index.html          ← 网站主体（无需修改）
├── style.css           ← 样式（无需修改）
├── main.js             ← 交互逻辑（无需修改）
│
├── about.md            ✏️ 企业介绍内容（Markdown 格式）
├── honor.json          ✏️ 相关荣誉列表
├── partner.json        ✏️ 合作伙伴列表
├── faq.json            ✏️ 常见问题列表
│
└── images/
    ├── about/          ← 企业介绍用图片
    ├── honors/         ← 荣誉证书图片
    └── partners/       ← 合作伙伴 logo 图片
```

---

## 1. 企业介绍 — `about.md`

使用标准 **Markdown** 格式编写。支持：

| 语法 | 效果 |
|------|------|
| `## 标题` | 二级标题（带蓝色左边框） |
| `### 小标题` | 三级标题 |
| `**加粗文字**` | **加粗** |
| `![说明](images/about/xxx.jpg)` | 插入图片 |
| 空行分隔 | 段落间距 |

**示例：**
```markdown
## 我们的使命

这里写企业使命的介绍文字。

![办公环境](images/about/office2.jpg)

### 业务亮点

详细说明业务亮点。
```

---

## 2. 相关荣誉 — `honor.json`

JSON 数组，每条荣誉包含以下字段：

| 字段 | 说明 | 是否必填 |
|------|------|---------|
| `title` | 荣誉名称 | ✅ 必填 |
| `institution` | 颁发机构 | ✅ 必填 |
| `year` | 年份 | 可选 |
| `image` | 证书图片路径（相对路径） | 可选 |
| `description` | 简短说明 | 可选 |

**示例：**
```json
[
  {
    "title": "新荣誉名称",
    "institution": "颁发机构名称",
    "year": "2024",
    "image": "images/honors/new_honor.jpg",
    "description": "荣誉说明文字"
  }
]
```

---

## 3. 合作伙伴 — `partner.json`

JSON 数组，每个合作伙伴包含以下字段：

| 字段 | 说明 | 是否必填 |
|------|------|---------|
| `name` | 企业名称 | ✅ 必填 |
| `logo` | Logo 图片路径 | 可选 |
| `category` | 分类（用于筛选按钮） | 可选 |
| `description` | 合作说明 | 可选 |

**分类建议**：`政府机构` / `科研院所` / `企业合作`（可自定义，系统自动生成筛选按钮）

**示例：**
```json
[
  {
    "name": "新合作企业名称",
    "logo": "images/partners/new_partner.png",
    "category": "企业合作",
    "description": "合作关系说明文字"
  }
]
```

---

## 4. 常见问题 — `faq.json`

JSON 数组，每条 FAQ 固定包含 4 个字段：

| 字段 | 说明 | 是否必填 |
|------|------|---------|
| `question` | 问题标题 | ✅ 必填 |
| `answer` | 完整答案 | ✅ 必填 |
| `category` | 分类（用于筛选按钮） | ✅ 必填 |
| `keypoints` | 要点数组（展示为标签） | ✅ 必填（可为空数组 `[]`） |

**示例：**
```json
[
  {
    "question": "新问题的标题？",
    "answer": "问题的详细答案写在这里，支持多行文字。",
    "category": "产品与服务",
    "keypoints": ["要点一", "要点二", "要点三"]
  }
]
```

---

## 图片说明

- 图片文件放入对应 `images/` 子目录
- JSON/Markdown 中使用**相对路径**引用，例如 `images/honors/cert.jpg`
- 推荐格式：JPG / PNG / WebP
- 荣誉证书建议尺寸：宽 600px 以上
- 合作伙伴 Logo 建议：正方形，白底或透明底 PNG

---

## 本地预览方法

网站使用 `fetch` 读取本地文件，**需要通过本地服务器访问**，不能直接双击 `index.html`。

**方法一（Python，推荐）**
```bash
cd fengxiangbiao-website
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

**方法二（Node.js）**
```bash
npx serve fengxiangbiao-website
```

**方法三（VS Code）**：安装 Live Server 插件，右键 `index.html` → Open with Live Server

---

*最后更新：2024年*
