export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'POST') { // 检查请求方法是否为 POST
    try {
      const requestData = await request.json(); // 解析 POST 请求的 JSON body
      const password = requestData.password;

      // 在这里进行你的密码验证逻辑
      // 例如，与环境变量或数据库中的密码进行比较
      const correctPassword = process.env.CORRECT_PASSWORD; // 假设你设置了环境变量

      if (password === correctPassword) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false, message: '密码不正确' }), {
          status: 401, // 可以返回 401 Unauthorized 状态码
          headers: { 'Content-Type': 'application/json' },
        });
      }

    } catch (error) {
      // 解析 JSON body 出错，或者其他错误
      console.error("Error processing POST request:", error);
      return new Response(JSON.stringify({ success: false, message: '服务器错误' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // 如果不是 POST 请求，返回 405 Method Not Allowed
    return new Response('Method Not Allowed', { status: 405 });
  }
}