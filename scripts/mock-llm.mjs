// Заглушка OpenAI-совместимого API для дымовой проверки чата в CI: отвечает одной строкой
// «URLS_IN_PROMPT=<n>» — сколько страниц сайта (строк «URL: ») сервер положил в системный промпт.
import http from 'node:http'

const chunk = delta => `data: ${JSON.stringify({ id: 'mock', object: 'chat.completion.chunk', created: 0, model: 'mock', choices: [{ index: 0, delta, finish_reason: delta.content ? null : 'stop' }] })}\n\n`

http.createServer((req, res) => {
  let body = ''
  req.on('data', d => body += d)
  req.on('end', () => {
    const system = (JSON.parse(body || '{}').messages || []).find(m => m.role === 'system')?.content || ''
    const urls = (system.match(/^URL: /gm) || []).length
    res.writeHead(200, { 'content-type': 'text/event-stream' })
    res.write(chunk({ content: `URLS_IN_PROMPT=${urls}` }))
    res.write(chunk({}))
    res.end('data: [DONE]\n\n')
  })
}).listen(Number(process.env.PORT || 4010), '127.0.0.1')
