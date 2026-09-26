const input = document.getElementById("url");
const button = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
    const url = input.value.trim();

    if (!url) {
        status.textContent = "Cole um link primeiro.";
        return;
    }

    button.disabled = true;
    result.innerHTML = "";
    status.textContent = "Processando vídeo...";

    try {
        const response = await fetch("/api/download", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao processar.");
        }

        status.textContent = "Vídeo pronto!";
        result.innerHTML = `
            <a class="download" href="${data.download}">
                ⬇️ Baixar MP4
            </a>
        `;
    } catch (error) {
        status.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});
