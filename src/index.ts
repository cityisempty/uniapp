import { z } from 'zod';
interface CardKey {
  key_code: string;
  is_used: boolean;
  first_used_at: number | null;
}

export interface Env {
  DB: D1Database;
}

function handleOptions(request: Request) {
  const origin = request.headers.get("Origin") || "*";
  
  if (request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null) {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      }
    })
  } else {
    return new Response(null, {
      headers: {
        "Allow": "GET, OPTIONS",
        "Access-Control-Allow-Origin": origin,
      }
    })
  }
}

// 添加 HTML 内容
const adminHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>卡密管理</title>
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .card-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .card-item {
            background-color: #f9f9f9;
            border: 1px solid #eee;
            border-radius: 4px;
            padding: 10px;
            font-family: monospace;
            font-size: 14px;
        }
        .actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        button {
            background-color: #1890ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #40a9ff;
        }
        button:disabled {
            background-color: #d9d9d9;
            cursor: not-allowed;
        }
        .status {
            text-align: center;
            margin-top: 20px;
            color: #666;
        }
        .loading {
            text-align: center;
            margin: 50px 0;
            font-size: 18px;
            color: #666;
        }
        .error {
            color: #f5222d;
            text-align: center;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>未使用卡密列表</h1>
        
        <div class="actions">
            <button id="copyBtn" disabled>一键复制全部卡密</button>
            <button id="refreshBtn">刷新列表</button>
        </div>
        
        <div id="status" class="status"></div>
        
        <div id="loading" class="loading">正在加载卡密数据...</div>
        <div id="error" class="error" style="display: none;"></div>
        
        <div id="cardList" class="card-list" style="display: none;"></div>
    </div>

    <script>
        const API_URL = '/api'; // 根据实际部署情况调整API地址
        
        // 页面加载完成后获取卡密数据
        document.addEventListener('DOMContentLoaded', fetchCardKeys);
        
        // 刷新按钮点击事件
        document.getElementById('refreshBtn').addEventListener('click', fetchCardKeys);
        
        // 复制按钮点击事件
        document.getElementById('copyBtn').addEventListener('click', copyAllCards);
        
        // 获取卡密数据
        async function fetchCardKeys() {
            const loadingEl = document.getElementById('loading');
            const errorEl = document.getElementById('error');
            const cardListEl = document.getElementById('cardList');
            const copyBtn = document.getElementById('copyBtn');
            const statusEl = document.getElementById('status');
            
            loadingEl.style.display = 'block';
            errorEl.style.display = 'none';
            cardListEl.style.display = 'none';
            copyBtn.disabled = true;
            statusEl.textContent = '';
            
            try {
                const response = await fetch(API_URL);
                if (!response.ok) {
                    throw new Error(\`HTTP错误: \${response.status}\`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || '获取卡密失败');
                }
                
                renderCardList(data.data);
                loadingEl.style.display = 'none';
                cardListEl.style.display = 'grid';
                copyBtn.disabled = false;
                statusEl.textContent = \`共找到 \${data.data.length} 个未使用的卡密\`;
                
            } catch (error) {
                loadingEl.style.display = 'none';
                errorEl.style.display = 'block';
                errorEl.textContent = \`获取卡密失败: \${error.message}\`;
            }
        }
        
        // 渲染卡密列表
        function renderCardList(cards) {
            const cardListEl = document.getElementById('cardList');
            cardListEl.innerHTML = '';
            
            if (cards.length === 0) {
                cardListEl.innerHTML = '<div class="error">没有找到未使用的卡密</div>';
                return;
            }
            
            cards.forEach(card => {
                const cardItem = document.createElement('div');
                cardItem.className = 'card-item';
                cardItem.textContent = card.key_code;
                cardListEl.appendChild(cardItem);
            });
        }
        
        // 复制所有卡密
        function copyAllCards() {
            const cardItems = document.querySelectorAll('.card-item');
            const statusEl = document.getElementById('status');
            
            if (cardItems.length === 0) {
                statusEl.textContent = '没有可复制的卡密';
                return;
            }
            
            const cardTexts = Array.from(cardItems).map(item => item.textContent).join('\\n');
            
            // 创建临时文本区域用于复制
            const textarea = document.createElement('textarea');
            textarea.value = cardTexts;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                statusEl.textContent = successful 
                    ? \`成功复制了 \${cardItems.length} 个卡密到剪贴板\` 
                    : '复制失败，请手动复制';
            } catch (err) {
                statusEl.textContent = '复制失败: ' + err;
            }
            
            document.body.removeChild(textarea);
        }
    </script>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    };
    
    // 处理 admin.html 请求
    if (url.pathname === "/admin" || url.pathname === "/admin.html") {
      return new Response(adminHtml, {
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          ...corsHeaders
        }
      });
    }
    
    // 处理 API 请求
    if (url.pathname === "/api") {
      if (request.method === "OPTIONS") {
        return handleOptions(request);
      }
      
      if (request.method !== "GET") {
        return new Response("请使用GET方法", { 
          status: 405,
          headers: corsHeaders
        });
      }
      
      try {
        const db = env.DB;
        
        // 获取100个未使用的卡密
        const unusedCards = await db.prepare(
          `SELECT key_code, is_used, first_used_at 
           FROM card_keys 
           WHERE is_used = 0
           LIMIT 100`
        ).all<CardKey>();
        
        if (!unusedCards || unusedCards.results.length === 0) {
          return new Response(JSON.stringify({
            success: false,
            message: "没有找到未使用的卡密",
            data: []
          }), {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders,
            }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: `成功获取${unusedCards.results.length}个未使用的卡密`,
          data: unusedCards.results
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          }
        });
      } catch (error) {
        console.error(`服务器错误: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`错误详情: ${error instanceof Error && error.stack ? error.stack : '无堆栈信息'}`);
        
        return new Response(JSON.stringify({
          success: false,
          message: `获取卡密时发生错误: ${error instanceof Error ? error.message : String(error)}`,
          data: []
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          }
        });
      }
    }
    
    // 处理其他请求
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }
};
