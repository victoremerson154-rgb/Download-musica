const urlInput = document.getElementById("url");
const button = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const downloadLink = document.getElementById("downloadLink");

button.addEventListener("click", async () => {
    const url = urlInput.value.trim();

    downloadLink.style.display = "none";

    if (!url) {
        status.textContent = "Cole o link do vídeo.";
        return;
    }

    button.disabled = true;
    button.textContent = "⏳ Preparando...";
    status.textContent = "Baixando vídeo e áudio...";

    try {
        const response = await fetch("/api/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Erro ao baixar o vídeo.");
        }

        status.textContent = "✅ Vídeo pronto!";

        downloadLink.href = data.download;
        downloadLink.download = "video.mp4";
        downloadLink.style.display = "block";

    } catch (error) {
        status.textContent = "❌ " + error.message;
    } finally {
        button.disabled = false;
        button.textContent = "⬇️ Baixar vídeo";
    }
});
