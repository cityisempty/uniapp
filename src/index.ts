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

export default {
  async fetch(request: Request, env: Env) {
    const origin = request.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    };
    
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
};
