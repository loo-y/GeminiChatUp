
# Gemini ChatUp

## 关于
本项目为基于 Google GeminiPro API Key 的聊天应用，支持响应式布局。可保留多组对话，每个对话的基础参数可单独设置。

<br /><img width="1552" alt="SCR-20240104-mgju" src="https://github.com/loo-y/GeminiChatUp/assets/2792566/cdfd758f-eb8e-4165-9047-85124188dfce" width=800><br />
<br /><img width="1552" alt="SCR-20240104-mgmn" src="https://github.com/loo-y/GeminiChatUp/assets/2792566/cf8c68ed-dded-483e-b69e-f19e022726b6" width=800><br />

## 如何使用

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Floo-y%2FGeminiChatUp&env=GOOGLE_GEMINI_API_KEY&envDescription=GeminiPro%20API%20Key&project-name=geminichatup&repository-name=geminichatup)

点击按钮部署至 Vercel，根据提示填入 Google GeminiPro API Key  



### 本地启动
1. 安装依赖包 
```
npm i
```

2. 本地启动
```javascript
npm run dev
```

### 待完成

1. 流式问答
2. 清除之前的conversation
3. 计算token并移除超出的conversation
4. 全局设置，支持客户端引入 GeminiPro API
5. 支持搜索对话内容
6. 引入 GeminiPro Vision API