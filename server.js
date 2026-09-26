const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/download", (req, res) => {
    const { url } = req.body;

    if (!url || !/^https?:\/\//i.test(url)) {
        return res.status(400).json({ error: "Link inválido." });
    }

    const id = crypto.randomBytes(12).toString("hex");
    const output = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

    const args = [
        "-m", "yt_dlp",
        "--no-playlist",
        "--js-runtimes", "deno",
        "--extractor-args", "youtubepot-bgutilhttp:base_url=http://127.0.0.1:4416",
        "-f", "bestaudio[ext=m4a]/bestaudio",
        "--no-write-thumbnail",
        "--no-write-info-json",
        "--no-write-playlist-metafiles",
        "--no-embed-metadata",
        "-o", output,
        "--print", "after_move:filepath",
        url
    ];

    console.log("Iniciando áudio direto:", url);

    const child = spawn("python3", args);

    let outputText = "";

    child.stdout.on("data", data => {
        const text = data.toString();
        outputText += text;
        console.log(text);
    });

    child.stderr.on("data", data => {
        console.log(data.toString());
    });

    child.on("error", error => {
        console.error(error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "Não foi possível iniciar o download."
            });
        }
    });

    child.on("close", code => {
        if (code !== 0) {
            if (!res.headersSent) {
                res.status(500).json({
                    error: "Não foi possível baixar o áudio."
                });
            }
            return;
        }

        const lines = outputText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(Boolean);

        let file = lines.find(line =>
            /\.(m4a|webm|opus|mp4)$/i.test(line) &&
            fs.existsSync(line)
        );

        if (file) {
            file = path.basename(file);
        } else {
            file = fs.readdirSync(DOWNLOAD_DIR).find(name =>
                name.startsWith(id + ".") &&
                /\.(m4a|webm|opus|mp4)$/i.test(name)
            );
        }

        if (!file) {
            return res.status(500).json({
                error: "O áudio não foi encontrado."
            });
        }

        res.json({
            success: true,
            download: `/download/${encodeURIComponent(file)}`
        });
    });
});

app.get("/download/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const file = path.join(DOWNLOAD_DIR, filename);

    if (!fs.existsSync(file)) {
        return res.status(404).send("Arquivo não encontrado.");
    }

    res.download(file, filename, error => {
        if (!error) {
            setTimeout(() => fs.unlink(file, () => {}), 3000);
        }
    });
});

app.get("/health", (req, res) => {
    res.json({ online: true });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("BAIXADOR DE ÁUDIO RÁPIDO ONLINE");
    console.log(`Porta: ${PORT}`);
});
