写剧本 (OneScreenplay)
专业剧本创作软件，采用标准剧本格式，支持场景、动作、角色、对话、转场五种核心元素，提供智能编辑与多格式导出功能。

功能特性
剧本编辑
五种剧本元素：场景、动作、角色、对话、转场，符合专业剧本写作规范
Tab 切换元素类型：按 Tab 键在 场景 → 动作 → 角色 → 对话 → 转场 之间循环切换，顶部导航栏实时高亮当前元素
智能换行：按 Enter 键自动创建下一个逻辑元素，如角色后自动创建对话，对话后自动创建角色
元素类型点击切换：点击顶部元素类型指示器可直接切换当前元素类型
A4 分页预览：编辑器模拟 A4 纸张，内容超出时自动分页

场景导航
左侧面板自动生成场景列表，点击即可跳转到对应场景
支持剧本标题和作者信息编辑

文件管理
新建剧本（Ctrl+N）
打开工程（Ctrl+O），支持 .spm 和 .json 格式
保存（Ctrl+S）/ 另存为（Ctrl+Shift+S），工程文件格式为 .spm（基于 JSON）
自动保存：可配置 1/3/5/10/15 分钟间隔，数据存储在 localStorage

多格式导出
PDF 导出：基于 jsPDF 生成 A4 格式 PDF
Word 导出：生成 Word 兼容的 HTML 文档（.doc）
HTML 导出：生成标准 HTML 文档，含完整排版样式

状态栏
实时显示当前元素类型、字数统计（中文字符 + 英文单词）、页数
保存状态与自动保存状态提示

快捷键
快捷键	功能
Tab	切换元素类型
Enter	智能换行（创建下一个逻辑元素）
Ctrl+S	保存
Ctrl+Shift+S	另存为
Ctrl+N	新建剧本
Ctrl+O	打开工程

使用方式
浏览器直接运行
用浏览器打开 jusuo-advanced.html 即可使用。浏览器环境下文件操作通过 File System Access API 和 localStorage 实现。

Electron 桌面应用
项目兼容 Electron 环境，在 Electron 中运行时可使用原生文件对话框和 IPC 通信进行文件读写，提供更完整的桌面应用体验。

剧本元素格式说明
元素类型	说明	排版样式
场景	场景标题，如"内景. 咖啡厅 - 白天"	加粗、大写、底部边框
动作	场景描述与动作描写	两端对齐
角色	说话角色名称	加粗、居中、大写
对话	角色台词	左右缩进 20%、两端对齐
转场	场景转换指示，如"切至："	右对齐、斜体、大写

OneScreenplay：Write professional screenplays in standard Hollywood format. Features intelligent character recognition and statistics to automatically track each role's lines, scenes, and appearances – helping you balance character presence and analyze your script at a glance. Clean interface, industry-standard styling, and zero subscription.📥 Microsoft Store: OneScreenplay（写剧本）
