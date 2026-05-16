// 写剧本应用程序主类
class JuShuoApp {
    constructor() {
        this.scriptData = {
            title: '无标题剧本',
            author: '',
            content: '',
            scenes: [],
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: '1.0'
            }
        };

        this.settings = {
            autoSave: true,
            autoSaveInterval: 5,
            savePath: null
        };

        this.elementTypes = ['scene', 'action', 'character', 'dialogue', 'transition'];
        this.elementNames = {
            scene: '场景',
            action: '动作',
            character: '角色',
            dialogue: '对话',
            transition: '转场'
        };

        this.currentElement = 'scene';
        this.isDirty = false;
        this.autoSaveTimer = null;
        this.tabHintTimer = null;
        this.fileHandle = null;
        this.pages = [];
        this.currentPageIndex = 0;
        this.pageHeight = 297; // A4 页面高度mm
        this.pageContentHeight = 237; // 去除页眉页脚后的内容高度mm

        this.init();
    }

    // 初始化应用
    init() {
        this.initElements();
        this.setupEventListeners();
        this.loadSettings();
        this.initEditor();
        this.setupAutoSave();
        this.showShortcutHint();
        // 初始化导出功能
        if (typeof JuShuoExport !== 'undefined') {
            this.exporter = new JuShuoExport(this);
        }
        
        // 添加元素类型点击事件监听器
        this.setupElementTypeClickListeners();
    }

    // 设置元素类型点击事件监听器
    setupElementTypeClickListeners() {
        const elementItems = document.querySelectorAll('.element-type-item');
        elementItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const elementType = e.target.dataset.type;
                if (elementType) {
                    this.handleElementTypeClick(elementType);
                }
            });
        });
    }

    // 处理元素类型点击
    handleElementTypeClick(elementType) {
        // 获取当前选中的元素
        const currentElement = this.getCurrentElement();
        if (currentElement) {
            // 改变当前元素的类型
            this.changeElementType(currentElement, elementType);
            this.currentElement = elementType;
            this.updateElementTypeDisplay();
            
            // 更新顶部导航栏指示器
            this.updateElementTypeIndicator(elementType);
            
            // 标记为已修改
            this.markAsDirty();
        } else {
            // 如果没有选中元素，在编辑器中创建一个新元素
            const newElement = this.createElement(elementType);
            this.setCursorToStart(newElement);
            this.currentElement = elementType;
            this.updateElementTypeDisplay();
        }
    }

    // 初始化DOM元素
    initElements() {
        this.editor = document.getElementById('editor');
        this.pageContainer = document.getElementById('page-container');
        this.sceneList = document.getElementById('scene-list');
        this.scriptTitle = document.getElementById('script-title');
        this.scriptAuthor = document.getElementById('script-author');
        this.elementTypeDisplay = document.getElementById('element-type');
        this.wordCountDisplay = document.getElementById('word-count');
        this.pageCountDisplay = document.getElementById('page-count');
        this.saveStatusDisplay = document.getElementById('save-status');
        this.autoSaveStatusDisplay = document.getElementById('auto-save-status');
        this.settingsModal = document.getElementById('settings-modal');
        this.notification = document.getElementById('notification');
        this.shortcutHint = document.getElementById('shortcut-hint');
        this.fileInput = document.getElementById('file-input');
        
        // 初始化页面管理
        this.initPagination();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 编辑器事件
        this.editor.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.editor.addEventListener('input', this.handleInput.bind(this));
        this.editor.addEventListener('click', this.handleClick.bind(this));
        this.editor.addEventListener('paste', this.handlePaste.bind(this));

        // 剧本信息事件
        this.scriptTitle.addEventListener('input', this.handleTitleChange.bind(this));
        this.scriptAuthor.addEventListener('input', this.handleAuthorChange.bind(this));

        // 菜单事件
        document.getElementById('new-script').addEventListener('click', this.newScript.bind(this));
        document.getElementById('open-script').addEventListener('click', this.openScript.bind(this));
        document.getElementById('save-script').addEventListener('click', this.saveScript.bind(this));
        document.getElementById('save-script-as').addEventListener('click', this.saveScriptAs.bind(this));
        document.getElementById('export-pdf').addEventListener('click', this.exportPDF.bind(this));
        document.getElementById('export-word').addEventListener('click', this.exportWord.bind(this));
        document.getElementById('export-html').addEventListener('click', this.exportHTML.bind(this));
        document.getElementById('settings-menu').addEventListener('click', this.openSettings.bind(this));
        
        // 关闭应用事件
        document.getElementById('close-app').addEventListener('click', this.closeApplication.bind(this));

        // 设置模态框事件
        document.getElementById('cancel-settings').addEventListener('click', this.closeSettings.bind(this));
        document.getElementById('save-settings').addEventListener('click', this.saveSettings.bind(this));
        document.getElementById('choose-save-path').addEventListener('click', this.chooseSavePath.bind(this));

        // 文件输入事件
        this.fileInput.addEventListener('change', this.handleFileOpen.bind(this));

        // 全局键盘事件
        document.addEventListener('keydown', this.handleGlobalKeyDown.bind(this));

        // 页面卸载前保存
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }

    // 初始化编辑器内容
    initEditor() {
        this.editor.innerHTML = '';
        this.createElement('scene', '内景. 咖啡厅 - 白天');
        this.createElement('action', '阳光透过玻璃窗洒进咖啡厅，空气中弥漫着咖啡的香气。顾客们轻声交谈，服务员来回穿梭。');
        this.createElement('character', '李明');
        this.createElement('dialogue', '（端起咖啡杯）这家的咖啡果然名不虚传。');
        this.createElement('character', '张华');
        this.createElement('dialogue', '（微笑）对吧？我经常来这里。环境很安静，很适合工作。');
        this.createElement('scene', '外景. 公园 - 傍晚');
        this.createElement('action', '夕阳西下，公园里的行人渐渐稀少。李明和张华漫步在小径上，影子被拉得很长。');
        
        this.updateDisplay();
        this.markAsSaved();
        // 初始化元素类型指示器
        this.updateElementTypeIndicator(this.currentElement);
    }

    // 创建剧本元素
    createElement(type, text = '') {
        const element = document.createElement('div');
        element.className = `element ${type}`;
        element.contentEditable = true;
        element.textContent = text;
        this.editor.appendChild(element);
        return element;
    }

    // 处理键盘事件
    handleKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            this.handleTab();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this.handleEnter();
        }
    }

    // 处理Tab键 - 切换元素类型
    handleTab() {
        try {
            const element = this.getCurrentElement();
            if (!element) return;

            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const text = element.textContent;
            const isEmptyOrAtEdge = text.trim() === '' || range.startOffset === 0 || range.startOffset === text.length;

            if (isEmptyOrAtEdge) {
                // 切换元素类型
                const currentType = this.getElementType(element);
                const nextType = this.getNextElementTypeForTab(currentType);
                this.changeElementType(element, nextType);
                this.currentElement = nextType;
                this.updateElementTypeDisplay();
                
                // 显示元素切换提示
                this.showTabSwitchHint(currentType, nextType);
            } else {
                // 插入制表符
                document.execCommand('insertText', false, '  ');
            }
        } catch (error) {
            this.showError('Tab键处理出错: ' + error.message);
        }
    }

    // 获取Tab键下一个元素类型
    getNextElementTypeForTab(currentType) {
        const currentIndex = this.elementTypes.indexOf(currentType);
        const nextIndex = (currentIndex + 1) % this.elementTypes.length;
        return this.elementTypes[nextIndex];
    }

    // 处理Enter键 - 智能换行
    handleEnter() {
        try {
            const element = this.getCurrentElement();
            if (!element) return;

            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;

            const range = selection.getRangeAt(0);
            const startOffset = range.startOffset;
            const text = element.textContent;
            const currentType = this.getElementType(element);

            // 在元素中间按Enter，分割当前元素
            if (startOffset > 0 && startOffset < text.length) {
                const beforeText = text.substring(0, startOffset);
                const afterText = text.substring(startOffset);

                element.textContent = beforeText;
                const newElement = this.createElement(currentType, afterText);
                element.parentNode.insertBefore(newElement, element.nextSibling);
                this.setCursorToStart(newElement);
            } else {
                // 在行首或行末按Enter，创建下一个元素
                const nextType = this.getNextElementType(currentType);
                const newElement = this.createElement(nextType);
                element.parentNode.insertBefore(newElement, element.nextSibling);
                this.currentElement = nextType;
                this.updateElementTypeDisplay();
                this.setCursorToStart(newElement);
            }

            this.updateDisplay();
        } catch (error) {
            this.showError('回车键处理出错: ' + error.message);
        }
    }

    // 获取下一个元素类型（根据剧本逻辑）
    getNextElementType(currentType) {
        switch (currentType) {
            case 'scene': return 'action';
            case 'action': return 'character';
            case 'character': return 'dialogue';
            case 'dialogue': return 'character';
            case 'transition': return 'scene';
            default: return 'action';
        }
    }

    // 获取当前光标所在元素
    getCurrentElement() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;

        let node = selection.anchorNode;
        while (node && node !== this.editor) {
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('element')) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    // 获取元素类型
    getElementType(element) {
        if (!element) return 'action';
        for (const type of this.elementTypes) {
            if (element.classList.contains(type)) {
                return type;
            }
        }
        return 'action';
    }

    // 改变元素类型
    changeElementType(element, newType) {
        // 移除所有类型类
        this.elementTypes.forEach(type => element.classList.remove(type));
        // 添加新类型类
        element.classList.add(newType);
    }

    // 设置光标到元素开始并滚动到视图
    setCursorToStart(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.setStart(element, 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        element.focus();
        // 滚动到元素位置
        this.scrollToElement(element);
    }

    // 设置光标到元素末尾并滚动到视图
    setCursorToEnd(element) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false); // false表示光标在末尾
        selection.removeAllRanges();
        selection.addRange(range);
        element.focus();
        // 滚动到元素位置
        this.scrollToElement(element);
    }

    // 设置光标到指定位置并滚动到视图
    setCursorToPosition(element, position) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.setStart(element.firstChild || element, position);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        element.focus();
        // 滚动到元素位置
        this.scrollToElement(element);
    }

    // 滚动到指定元素位置
    scrollToElement(element) {
        // 获取元素在页面中的位置
        const rect = element.getBoundingClientRect();
        const container = this.pageContainer;
        
        // 如果元素在视图外，则滚动到元素位置
        if (rect.bottom > window.innerHeight - 100 || rect.top < 100) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    // 处理输入事件
    handleInput() {
        this.updateDisplay();
        this.markAsDirty();
    }

    // 处理点击事件
    handleClick(e) {
        const element = this.getCurrentElement();
        if (element) {
            // 移除所有当前标记
            document.querySelectorAll('.element.current').forEach(el => el.classList.remove('current'));
            // 添加当前标记
            element.classList.add('current');
            
            const type = this.getElementType(element);
            this.currentElement = type;
            this.updateElementTypeDisplay();
        }
    }

    // 处理粘贴事件
    handlePaste(e) {
        e.preventDefault();
        
        // 首先尝试获取HTML格式的内容
        const htmlContent = e.clipboardData.getData('text/html');
        if (htmlContent) {
            // 如果有HTML内容，尝试提取纯文本
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            const text = tempDiv.textContent || tempDiv.innerText || '';
            document.execCommand('insertText', false, text);
        } else {
            // 如果没有HTML内容，使用纯文本
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }
    }

    // 更新显示
    updateDisplay() {
        this.updateSceneList();
        this.updateWordCount();
        this.updatePageCount();
        // 检查分页
        this.checkAndHandlePagination();
    }

    // 更新场景列表
    updateSceneList() {
        this.sceneList.innerHTML = '';
        const scenes = this.editor.querySelectorAll('.scene');
        
        scenes.forEach((scene, index) => {
            const sceneItem = document.createElement('div');
            sceneItem.className = 'scene-item';
            
            const sceneNumber = document.createElement('span');
            sceneNumber.className = 'scene-number';
            sceneNumber.textContent = `场景 ${index + 1}`;
            
            const sceneText = scene.textContent.trim() || '未命名场景';
            sceneItem.innerHTML = `<span class="scene-number">场景 ${index + 1}</span>${sceneText}`;
            
            sceneItem.addEventListener('click', () => {
                // 移除所有激活状态
                document.querySelectorAll('.scene-item').forEach(item => item.classList.remove('active'));
                // 添加当前激活状态
                sceneItem.classList.add('active');
                // 滚动到对应场景
                scene.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // 设置焦点
                this.setCursorToStart(scene);
            });
            
            this.sceneList.appendChild(sceneItem);
        });

        // 更新剧本数据
        this.scriptData.scenes = Array.from(scenes).map(scene => scene.textContent.trim());
    }

    // 更新字数统计
    updateWordCount() {
        const text = this.editor.textContent;
        // 中文字符计数
        const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        // 英文单词计数
        const englishWords = text.replace(/[\u4e00-\u9fff]/g, '').trim().split(/\s+/).filter(word => word.length > 0).length;
        const totalCount = chineseChars + englishWords;
        this.wordCountDisplay.textContent = totalCount;
    }

    // 更新页数统计
    updatePageCount() {
        // 使用实际页面数量
        this.pageCountDisplay.textContent = this.pages ? this.pages.length : 1;
    }

    // 更新元素类型显示
    updateElementTypeDisplay() {
        this.elementTypeDisplay.textContent = this.elementNames[this.currentElement] || '未知';
        // 同时更新顶部导航栏的指示器
        this.updateElementTypeIndicator(this.currentElement);
    }

    // 处理剧本标题变化
    handleTitleChange() {
        this.scriptData.title = this.scriptTitle.value;
        this.markAsDirty();
        // 更新所有页面的页眉
        if (this.pages) {
            this.pages.forEach(page => {
                this.updatePageHeader(page.element);
            });
        }
    }

    // 处理作者变化
    handleAuthorChange() {
        this.scriptData.author = this.scriptAuthor.value;
        this.markAsDirty();
    }

    // 标记为未保存
    markAsDirty() {
        if (!this.isDirty) {
            this.isDirty = true;
            this.saveStatusDisplay.textContent = '未保存';
            this.saveStatusDisplay.style.color = 'var(--accent-color)';
        }
    }

    // 标记为已保存
    markAsSaved() {
        this.isDirty = false;
        this.saveStatusDisplay.textContent = '已保存';
        this.saveStatusDisplay.style.color = 'var(--text-secondary)';
    }

    // 显示通知
    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type} show`;
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    // 显示错误通知
    showError(message) {
        this.showNotification(message, 'error');
        console.error('[写剧本错误]', message);
    }

    // 显示成功通知
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // 显示信息通知
    showInfo(message) {
        this.showNotification(message, 'info');
    }

    // 显示Tab切换提示 - 顶部导航栏高亮显示
    showTabSwitchHint(fromType, toType) {
        // 更新顶部导航栏中的元素类型高亮
        this.updateElementTypeIndicator(toType);
    }

    // 更新元素类型指示器
    updateElementTypeIndicator(activeType) {
        const elementItems = document.querySelectorAll('.element-type-item');
        elementItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.type === activeType) {
                item.classList.add('active');
            }
        });
    }

    // 显示快捷键提示
    showShortcutHint() {
        setTimeout(() => {
            this.shortcutHint.classList.add('show');
        }, 2000);
    }

    // 处理全局键盘事件
    handleGlobalKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.saveScriptAs();
                    } else {
                        this.saveScript();
                    }
                    break;
                case 'n':
                    e.preventDefault();
                    this.newScript();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openScript();
                    break;
            }
        }
    }

    // 页面卸载前处理
    handleBeforeUnload(e) {
        if (this.isDirty) {
            const confirmationMessage = '您有未保存的更改，确定要离开吗？';
            e.preventDefault();
            e.returnValue = confirmationMessage;
            return confirmationMessage;
        }
    }

    // 新建剧本
    newScript() {
        if (this.isDirty && !confirm('您有未保存的更改，确定要新建剧本吗？')) {
            return;
        }

        this.scriptData = {
            title: '无标题剧本',
            author: '',
            content: '',
            scenes: [],
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString(),
                version: '1.0'
            }
        };

        this.scriptTitle.value = this.scriptData.title;
        this.scriptAuthor.value = this.scriptData.author;
        this.fileHandle = null;
        
        this.initEditor();
        this.showNotification('新建剧本成功', 'success');
    }

    // 保存剧本 - 使用IPC通信的版本
    async saveScript() {
        try {
            // 确保在保存前更新scriptData的所有字段
            this.scriptData.content = this.editor.innerHTML;
            this.scriptData.title = this.scriptTitle.value;
            this.scriptData.author = this.scriptAuthor.value;
            this.scriptData.metadata.modified = new Date().toISOString();

            const scriptJson = JSON.stringify(this.scriptData, null, 2);
            
            // 检查是否在Electron环境中
            const isElectron = typeof require !== 'undefined' && typeof process !== 'undefined';
            
            // 如果在Electron环境中，使用IPC通信
            if (isElectron) {
                try {
                    const { ipcRenderer } = require('electron');
                    // 如果有当前文件路径，直接保存；否则使用另存为
                    const result = this.currentFilePath 
                        ? await ipcRenderer.invoke('save-file', scriptJson, this.currentFilePath)
                        : await ipcRenderer.invoke('save-as-file', scriptJson);
                    
                    if (result.success) {
                        this.currentFilePath = result.filePath;
                        this.markAsSaved();
                        this.showSuccess('保存成功');
                        return;
                    } else {
                        throw new Error(result.reason || result.error);
                    }
                } catch (ipcError) {
                    console.error('IPC保存出错:', ipcError);
                    // 降级到本地存储
                    localStorage.setItem('jusuo_script_backup', scriptJson);
                    this.markAsSaved();
                    this.showInfo('已保存到本地存储');
                }
            }
            
            // 如果没有文件句柄或直接保存失败，使用另存为
            await this.saveScriptAs();
        } catch (error) {
            this.showError('保存失败: ' + error.message);
        }
    }

    // 另存为 - 使用IPC通信的版本
    async saveScriptAs() {
        try {
            // 确保在保存前更新scriptData
            this.scriptData.content = this.editor.innerHTML;
            this.scriptData.title = this.scriptTitle.value;
            this.scriptData.author = this.scriptAuthor.value;
            this.scriptData.metadata.modified = new Date().toISOString();

            const scriptJson = JSON.stringify(this.scriptData, null, 2);
            
            // 检查是否在Electron环境中
            const isElectron = typeof require !== 'undefined' && typeof process !== 'undefined';
            
            // 如果在Electron环境中，使用IPC通信
            if (isElectron) {
                try {
                    const { ipcRenderer } = require('electron');
                    const result = await ipcRenderer.invoke('save-as-file', scriptJson);
                    
                    if (result.success) {
                        this.currentFilePath = result.filePath;
                        this.markAsSaved();
                        this.showSuccess('保存成功');
                        return;
                    } else {
                        throw new Error(result.reason || result.error);
                    }
                } catch (ipcError) {
                    console.error('IPC另存为出错:', ipcError);
                }
            }

            // 使用文件选择器保存（浏览器环境）
            this.fileHandle = await window.showSaveFilePicker({
                suggestedName: `${this.scriptData.title}.spm`,
                types: [{
                    description: '剧本工程文件',
                    accept: { 'application/json': ['.spm'] }
                }]
            });

            const writable = await this.fileHandle.createWritable();
            await writable.write(scriptJson);
            await writable.close();

            this.markAsSaved();
            this.showSuccess('保存成功');
        } catch (error) {
            if (error.name !== 'AbortError') {
                // 降级到本地存储
                localStorage.setItem('jusuo_script_backup', JSON.stringify(this.scriptData));
                this.markAsSaved();
                this.showInfo('已保存到本地存储');
            }
        }
    }

    // 打开剧本
    openScript() {
        if (this.isDirty && !confirm('您有未保存的更改，确定要打开新剧本吗？')) {
            return;
        }
        this.fileInput.click();
    }

    // 处理文件打开
    async handleFileOpen(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            this.scriptData = data;
            this.scriptTitle.value = data.title || '无标题剧本';
            this.scriptAuthor.value = data.author || '';
            this.editor.innerHTML = data.content || '';
            
            this.updateDisplay();
            this.markAsSaved();
            this.showNotification('打开成功', 'success');
        } catch (error) {
            this.showNotification('文件格式错误', 'error');
        }

        // 清空文件输入
        e.target.value = '';
    }

    // 导出PDF
    exportPDF() {
        this.showNotification('PDF导出功能开发中...', 'info');
    }

    // 导出Word
    exportWord() {
        this.showNotification('Word导出功能开发中...', 'info');
    }

    // 导出HTML
    exportHTML() {
        const html = this.generateExportHTML();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.scriptData.title}.html`;
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('HTML导出成功', 'success');
    }

    // 生成导出HTML
    generateExportHTML() {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${this.scriptData.title}</title>
    <style>
        body { font-family: 'SimSun', serif; font-size: 12pt; line-height: 1.6; margin: 2cm; }
        .scene { font-weight: bold; margin: 20px 0 12px 0; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 0.2cm; }
        .action { margin: 8px 0; text-align: justify; }
        .character { font-weight: bold; text-align: center; margin: 12px 0 2px 0; text-transform: uppercase; }
        .dialogue { margin: 2px 20% 8px 20%; text-align: justify; }
        .transition { text-align: right; margin: 16px 0; font-style: italic; text-transform: uppercase; }
    </style>
</head>
<body>
    <h1>${this.scriptData.title}</h1>
    <p>作者：${this.scriptData.author}</p>
    <hr>
    ${this.editor.innerHTML}
</body>
</html>`;
    }

    // 打开设置
    openSettings() {
        document.getElementById('auto-save-enabled').checked = this.settings.autoSave;
        document.getElementById('auto-save-interval').value = this.settings.autoSaveInterval;
        this.settingsModal.classList.add('show');
    }

    // 关闭设置
    closeSettings() {
        this.settingsModal.classList.remove('show');
    }

    // 保存设置
    saveSettings() {
        this.settings.autoSave = document.getElementById('auto-save-enabled').checked;
        this.settings.autoSaveInterval = parseInt(document.getElementById('auto-save-interval').value);
        
        localStorage.setItem('jusuo_settings', JSON.stringify(this.settings));
        
        this.setupAutoSave();
        this.updateAutoSaveStatus();
        this.closeSettings();
        this.showNotification('设置已保存', 'success');
    }

    // 选择保存路径
    chooseSavePath() {
        this.showNotification('目录选择功能需要更高级的文件API支持', 'info');
    }

    // 加载设置
    loadSettings() {
        const saved = localStorage.getItem('jusuo_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.updateAutoSaveStatus();
    }

    // 设置自动保存
    setupAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        if (this.settings.autoSave) {
            this.autoSaveTimer = setInterval(() => {
                if (this.isDirty) {
                    this.autoSave();
                }
            }, this.settings.autoSaveInterval * 60 * 1000);
        }
    }

    // 自动保存
    async autoSave() {
        try {
            this.scriptData.content = this.editor.innerHTML;
            localStorage.setItem('jusuo_autosave', JSON.stringify(this.scriptData));
            this.showNotification('已自动保存', 'success');
        } catch (error) {
            console.error('自动保存失败:', error);
        }
    }

    // 更新自动保存状态
    updateAutoSaveStatus() {
        this.autoSaveStatusDisplay.textContent = this.settings.autoSave 
            ? `自动保存: 启用 (${this.settings.autoSaveInterval}分钟)`
            : '自动保存: 关闭';
    }

    // 初始化分页系统
    initPagination() {
        this.pages = [{
            element: document.querySelector('.page'),
            editor: this.editor,
            number: 1
        }];
        
        // 添加页码显示
        this.addPageNumberToPage(this.pages[0].element, 1);
    }

    // 为页面添加页码
    addPageNumberToPage(pageElement, pageNumber) {
        // 检查是否已存在页码元素
        let pageNumberElement = pageElement.querySelector('.page-number');
        if (!pageNumberElement) {
            pageNumberElement = document.createElement('div');
            pageNumberElement.className = 'page-number';
            pageElement.appendChild(pageNumberElement);
        }
        pageNumberElement.textContent = `第 ${pageNumber} 页`;
    }

    // 创建新页面
    createNewPage(pageNumber) {
        const pageElement = document.createElement('div');
        pageElement.className = 'page';
        
        // 添加页码
        const pageNumberElement = document.createElement('div');
        pageNumberElement.className = 'page-number';
        pageNumberElement.textContent = `第 ${pageNumber} 页`;
        pageElement.appendChild(pageNumberElement);
        
        const editor = document.createElement('div');
        editor.className = 'editor';
        editor.contentEditable = true;
        pageElement.appendChild(editor);
        
        this.pageContainer.appendChild(pageElement);
        
        // 为新编辑器添加事件监听
        editor.addEventListener('keydown', this.handleKeyDown.bind(this));
        editor.addEventListener('input', this.handleInput.bind(this));
        editor.addEventListener('click', this.handleClick.bind(this));
        editor.addEventListener('paste', this.handlePaste.bind(this));
        
        const pageData = {
            element: pageElement,
            editor: editor,
            number: pageNumber
        };
        
        this.pages.push(pageData);
        
        return pageData;
    }

    // 更新页码
    updatePageNumber(pageElement, pageNumber) {
        const pageNumberElement = pageElement.querySelector('.page-number');
        if (pageNumberElement) {
            pageNumberElement.textContent = `第 ${pageNumber} 页`;
        }
    }

    // 更新页眉
    updatePageHeader(pageElement) {
        // 页眉已移除，此函数现在为空
    }

    // 检查并处理分页
    checkAndHandlePagination() {
        // 简化版本：按内容高度自动分页
        const allElements = document.querySelectorAll('.element');
        let currentPageIndex = 0;
        let currentPageHeight = 0;
        const maxPageHeight = this.pageContentHeight * 3.77953; // 转换为px（约903px）
        let newPageCreated = false;
        
        allElements.forEach((element, index) => {
            const elementHeight = element.offsetHeight;
            
            if (currentPageHeight + elementHeight > maxPageHeight && currentPageIndex < this.pages.length - 1) {
                // 需要分页
                currentPageIndex++;
                currentPageHeight = elementHeight;
                
                // 如果需要更多页面，创建它们
                if (currentPageIndex >= this.pages.length) {
                    this.createNewPage(currentPageIndex + 1);
                    newPageCreated = true;
                }
                
                // 将元素移动到新页面
                this.pages[currentPageIndex].editor.appendChild(element);
            } else {
                // 确保元素在正确的页面上
                if (element.parentNode !== this.pages[currentPageIndex].editor) {
                    this.pages[currentPageIndex].editor.appendChild(element);
                }
                currentPageHeight += elementHeight;
            }
        });
        
        // 更新所有页面的页码
        this.pages.forEach((page, index) => {
            this.updatePageNumber(page.element, index + 1);
        });
        
        // 更新页数显示
        this.pageCountDisplay.textContent = this.pages.length;
        
        // 如果创建了新页面，滚动到新页面
        if (newPageCreated && this.pages.length > 1) {
            const lastPage = this.pages[this.pages.length - 1].element;
            lastPage.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // 关闭应用确认
    closeApplication() {
        if (this.isDirty && !confirm('您有未保存的更改，确定要关闭应用吗？')) {
            return;
        }
        // 在Electron应用中，可以使用以下代码关闭窗口
        // 如果在浏览器中运行，则提示用户手动关闭标签页
        if (typeof require !== 'undefined') {
            try {
                const remote = require('electron').remote;
                const window = remote.getCurrentWindow();
                window.close();
            } catch (e) {
                // 如果在浏览器中，提示用户关闭标签页
                alert('请手动关闭此标签页以退出应用');
            }
        } else {
            // 在浏览器中运行时，提示用户关闭标签页
            alert('请手动关闭此标签页以退出应用');
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.juShuoApp = new JuShuoApp();
});