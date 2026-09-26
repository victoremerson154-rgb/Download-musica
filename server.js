const express = require("express");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = path.join(__dirname, "downloads");

fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/download", (req, res) => {
    const { url } = req.body;

    if (!url || !/^https?:\/\//i.test(url)) {
        return res.status(400).json({
            error: "Envie um link válido."
        });
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const output = path.join(DOWNLOAD_DIR, `${id}.%(ext)s`);

    const args = [
        "--no-playlist",
        "-f", "bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--remote-components", "ejs:github",
        "--extractor-args", "youtubepot-bgutilhttp:base_url=http://127.0.0.1:4416",
        "--extractor-args", "youtube:player-client=mweb",
        "--js-runtimes", "deno",
        "-o", output,
        url
    ];

    const process = spawn("yt-dlp", [
        "--js-runtimes", "deno:/root/.deno/bin/deno",
        ...args
    ]);

    let errorOutput = "";

    process.stderr.on("data", data => {
        errorOutput += data.toString();
    });

    process.on("close", code => {
        if (code !== 0) {
            console.error(errorOutput);
            return res.status(500).json({
                error: "Não foi possível processar o vídeo."
            });
        }

        const files = fs.readdirSync(DOWNLOAD_DIR)
            .filter(file => file.startsWith(id + "."));

        if (!files.length) {
            return res.status(500).json({
                error: "O arquivo não foi encontrado."
            });
        }

        const filename = files[0];

        res.json({
            success: true,
            download: `/download/${encodeURIComponent(filename)}`
        });
    });
});

app.get("/download/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const file = path.join(DOWNLOAD_DIR, filename);

    if (!fs.existsSync(file)) {
        return res.status(404).send("Arquivo não encontrado.");
    }

    res.download(file, "video.mp4", () => {
        fs.unlink(file, () => {});
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("================================");
    console.log("      BAIXADOR MP4 ONLINE");
    console.log("================================");
    console.log(`Servidor: http://0.0.0.0:${PORT}`);
    console.log("");
});
