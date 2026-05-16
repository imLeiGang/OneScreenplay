// 导出功能模块
class JuShuoExport {
    constructor(app) {
        this.app = app;
    }

    // 导出为PDF
    async exportToPDF() {
        try {
            // 使用jsPDF库
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // 使用内置字体支持中文
            pdf.setFont('helvetica');
            pdf.setFontSize(12);

            // 获取剧本内容
            const elements = this.app.editor.querySelectorAll('.element');
            let y = 30;
            const pageHeight = 297;
            const margin = 25;
            const lineHeight = 6;

            // 添加页眉信息
            pdf.setFontSize(16);
            pdf.text(this.app.scriptData.title, margin, 20);
            pdf.setFontSize(12);
            pdf.text(`作者：${this.app.scriptData.author}`, margin, 25);

            elements.forEach((element) => {
                const text = element.textContent.trim();
                if (!text) return;

                const type = this.app.getElementType(element);
                // 使用更简单的文本分割方法
                const lines = this.wrapText(text, 80);

                // 检查是否需要分页
                if (y + lines.length * lineHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = 30;
                }

                // 根据元素类型设置样式和位置
                this.setElementStyle(pdf, type);
                const x = this.getElementX(type, margin);

                lines.forEach((line) => {
                    // 确保文本正确编码
                    const encodedLine = this.encodeText(line);
                    pdf.text(encodedLine, x, y);
                    y += lineHeight;
                });

                y += this.getElementSpacing(type);
            });

            // 保存PDF
            pdf.save(`${this.app.scriptData.title}.pdf`);
            this.app.showNotification('PDF导出成功', 'success');
        } catch (error) {
            console.error('PDF导出失败:', error);
            this.app.showNotification('PDF导出失败，请检查浏览器支持', 'error');
        }
    }

    // 简单的文本换行方法
    wrapText(text, maxWidth) {
        const lines = [];
        const words = text.split('');
        let line = '';
        
        for (let i = 0; i < words.length; i++) {
            if (line.length >= maxWidth) {
                lines.push(line);
                line = words[i];
            } else {
                line += words[i];
            }
        }
        
        if (line) {
            lines.push(line);
        }
        
        return lines;
    }

    // 文本编码处理
    encodeText(text) {
        // 简单的文本清理
        return text.replace(/[^\x20-\x7E\u4e00-\u9fa5]/g, '');
    }

    // 导出为Word格式（使用docx库或HTML转换）
    async exportToWord() {
        try {
            // 生成Word兼容的HTML
            const wordHtml = this.generateWordHTML();
            
            // 创建Blob
            const blob = new Blob([wordHtml], { 
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            });
            
            // 下载文件
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.app.scriptData.title}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.app.showNotification('Word导出成功', 'success');
        } catch (error) {
            console.error('Word导出失败:', error);
            this.app.showNotification('Word导出失败', 'error');
        }
    }

    // 导出为HTML
    exportToHTML() {
        try {
            const html = this.generateStandardHTML();
            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.app.scriptData.title}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.app.showNotification('HTML导出成功', 'success');
        } catch (error) {
            console.error('HTML导出失败:', error);
            this.app.showNotification('HTML导出失败', 'error');
        }
    }

    // 生成标准HTML格式
    generateStandardHTML() {
        const elements = this.app.editor.querySelectorAll('.element');
        let content = '';

        elements.forEach((element) => {
            const text = element.textContent.trim();
            if (!text) return;

            const type = this.app.getElementType(element);
            content += `<div class="${type}">${this.escapeHtml(text)}</div>\n`;
        });

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(this.app.scriptData.title)}</title>
    <style>
        body {
            font-family: 'SimSun', 'FangSong', serif;
            font-size: 12pt;
            line-height: 1.6;
            max-width: 21cm;
            margin: 0 auto;
            padding: 2.5cm 3cm;
            color: #333;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2cm;
            border-bottom: 2px solid #333;
            padding-bottom: 1cm;
        }
        
        .title {
            font-size: 20pt;
            font-weight: bold;
            margin-bottom: 0.5cm;
        }
        
        .author {
            font-size: 14pt;
            color: #666;
        }
        
        .scene {
            font-weight: bold;
            margin: 20px 0 12px 0;
            text-transform: uppercase;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.2cm;
        }
        
        .action {
            margin: 8px 0;
            text-align: justify;
        }
        
        .character {
            font-weight: bold;
            text-align: center;
            margin: 12px 0 2px 0; /* 减少间距：上12px，下2px */
            text-transform: uppercase;
        }
        
        .dialogue {
            margin: 2px 20% 8px 20%; /* 减少间距：上2px，下8px */
            text-align: justify;
        }
        
        .transition {
            text-align: right;
            margin: 16px 0;
            font-style: italic;
            text-transform: uppercase;
        }
        
        @media print {
            body { margin: 0; padding: 2cm; }
            .scene { page-break-before: auto; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${this.escapeHtml(this.app.scriptData.title)}</div>
        <div class="author">作者：${this.escapeHtml(this.app.scriptData.author || '未署名')}</div>
        <div style="font-size: 10pt; color: #999; margin-top: 0.5cm;">
            创建时间：${new Date(this.app.scriptData.metadata.created).toLocaleDateString('zh-CN')}
        </div>
    </div>
    
    <div class="content">
        ${content}
    </div>
    
    <div style="margin-top: 2cm; padding-top: 1cm; border-top: 1px solid #ddd; font-size: 10pt; color: #999; text-align: center;">
        <p>本剧本由写剧本软件创作 - 专业中文剧本创作工具</p>
        <p>导出时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
</body>
</html>`;
    }

    // 生成Word兼容的HTML
    generateWordHTML() {
        const elements = this.app.editor.querySelectorAll('.element');
        let content = '';

        elements.forEach((element) => {
            const text = element.textContent.trim();
            if (!text) return;

            const type = this.app.getElementType(element);
            const styles = this.getWordElementStyles(type);
            content += `<p style="${styles}">${this.escapeHtml(text)}</p>\n`;
        });

        return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>${this.escapeHtml(this.app.scriptData.title)}</title>
    <!--[if gte mso 9]>
    <xml>
    <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>90</w:Zoom>
    <w:DoNotPromptForConvert/>
    <w:DoNotShowInsertionsAndDeletions/>
    </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        body { font-family: 'SimSun'; font-size: 12pt; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 18pt; font-weight: bold; }
        .author { font-size: 14pt; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <p class="title">${this.escapeHtml(this.app.scriptData.title)}</p>
        <p class="author">作者：${this.escapeHtml(this.app.scriptData.author || '未署名')}</p>
    </div>
    ${content}
</body>
</html>`;
    }

    // 获取Word元素样式
    getWordElementStyles(type) {
        const baseStyle = 'font-family: SimSun; font-size: 12pt; line-height: 1.6;';
        
        switch (type) {
            case 'scene':
                return `${baseStyle} font-weight: bold; margin: 20px 0 12px 0; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 0.2cm;`;
            case 'action':
                return `${baseStyle} margin: 8px 0; text-align: justify;`;
            case 'character':
                return `${baseStyle} font-weight: bold; text-align: center; margin: 12px 0 2px 0; text-transform: uppercase;`; /* 减少间距 */
            case 'dialogue':
                return `${baseStyle} margin: 2px 20% 8px 20%; text-align: justify;`; /* 减少间距 */
            case 'transition':
                return `${baseStyle} text-align: right; margin: 16px 0; font-style: italic; text-transform: uppercase;`;
            default:
                return baseStyle;
        }
    }

    // PDF辅助方法
    splitTextToLines(pdf, text, maxWidth) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';

        for (const char of words) {
            const testLine = currentLine + char;
            const width = pdf.getTextWidth(testLine);
            
            if (width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    getElementWidth(type) {
        const pageWidth = 160; // A4宽度减去边距
        
        switch (type) {
            case 'dialogue':
                return pageWidth * 0.6; // 对话占60%宽度
            case 'character':
                return pageWidth * 0.8; // 角色名居中，占80%宽度
            default:
                return pageWidth; // 其他元素占全宽
        }
    }

    getElementX(type, margin) {
        const pageWidth = 160;
        
        switch (type) {
            case 'dialogue':
                return margin + pageWidth * 0.2; // 对话左缩进20%
            case 'character':
                return margin + pageWidth * 0.1; // 角色名居中
            case 'transition':
                return margin + pageWidth * 0.5; // 转场右对齐
            default:
                return margin; // 其他元素左对齐
        }
    }

    setElementStyle(pdf, type) {
        switch (type) {
            case 'scene':
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                break;
            case 'character':
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(12);
                break;
            case 'transition':
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(12);
                break;
            default:
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(12);
                break;
        }
    }

    getElementSpacing(type) {
        switch (type) {
            case 'scene':
                return 8;
            case 'character':
                return 4;
            case 'dialogue':
                return 6;
            default:
                return 4;
        }
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 扩展主应用类以包含导出功能
if (typeof JuShuoApp !== 'undefined') {
    JuShuoApp.prototype.initExport = function() {
        this.exporter = new JuShuoExport(this);
    };

    // 重写导出方法
    JuShuoApp.prototype.exportPDF = function() {
        if (!this.exporter) this.initExport();
        this.exporter.exportToPDF();
    };

    JuShuoApp.prototype.exportWord = function() {
        if (!this.exporter) this.initExport();
        this.exporter.exportToWord();
    };

    JuShuoApp.prototype.exportHTML = function() {
        if (!this.exporter) this.initExport();
        this.exporter.exportToHTML();
    };
}