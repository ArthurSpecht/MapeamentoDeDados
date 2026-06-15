import http from "http";
import fs from "fs";
import path from "path";

const sessionId = "login-refresh-loop";
const outdir = path.resolve(".dbg");
const host = "127.0.0.1";
const port = 7777;
const logFile = path.join(outdir, `trae-debug-log-${sessionId}.ndjson`);
const envFile = path.join(outdir, `${sessionId}.env`);

fs.mkdirSync(outdir, { recursive: true });
fs.writeFileSync(logFile, "");
fs.writeFileSync(
  envFile,
  `DEBUG_SERVER_URL=http://${host}:${port}/event\nDEBUG_SESSION_ID=${sessionId}\n`
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS" && req.url === "/event") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/event") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const event = JSON.parse(body || "{}");
        if (!event.ts) event.ts = Date.now();
        fs.appendFileSync(logFile, `${JSON.stringify(event)}\n`);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, sessionId, logFile, envFile }));
    return;
  }

  if (req.method === "GET" && req.url?.startsWith("/logs")) {
    res.writeHead(200, { "Content-Type": "application/x-ndjson" });
    res.end(fs.existsSync(logFile) ? fs.readFileSync(logFile, "utf8") : "");
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(port, host, () => {
  process.stdout.write("@@DEBUG_SERVER_INFO\n");
  process.stdout.write(
    JSON.stringify(
      {
        api_url: `http://${host}:${port}/event`,
        session_id: sessionId,
        log_dir: outdir,
        log_file: logFile,
        env_file: envFile,
      },
      null,
      2
    )
  );
  process.stdout.write("\n@@END_DEBUG_SERVER_INFO\n");
});
