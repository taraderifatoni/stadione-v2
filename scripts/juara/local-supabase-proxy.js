// Local rehearsal proxy: auth → production GoTrue, REST → isolated staging PostgREST.
// Not for production use.
const http = require("node:http")
const https = require("node:https")

const REST = { host: "127.0.0.1", port: 3101 }
const AUTH = { host: "api.stadione.pro", port: 443, tls: true }

function forward(req, res, target, path) {
  const lib = target.tls ? https : http
  const options = {
    host: target.host,
    port: target.port,
    method: req.method,
    path,
    headers: { ...req.headers, host: target.tls ? target.host : `${target.host}:${target.port}` },
  }
  const upstream = lib.request(options, (up) => {
    const headers = { ...up.headers }
    headers["access-control-allow-origin"] = "*"
    headers["access-control-allow-headers"] = "*"
    headers["access-control-allow-methods"] = "GET,POST,PATCH,PUT,DELETE,OPTIONS"
    res.writeHead(up.statusCode || 502, headers)
    up.pipe(res)
  })
  upstream.on("error", (e) => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" })
    res.end(JSON.stringify({ error: "proxy_upstream", message: e.message }))
  })
  req.pipe(upstream)
}

http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    })
    return res.end()
  }
  const url = new URL(req.url, "http://localhost")
  if (url.pathname.startsWith("/rest/v1/")) {
    const path = url.pathname.slice("/rest/v1".length) + url.search
    forward(req, res, REST, path)
  } else {
    forward(req, res, AUTH, url.pathname + url.search)
  }
}).listen(3102, "127.0.0.1", () => console.log("proxy ready on 3102"))
