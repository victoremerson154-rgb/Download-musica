FROM node:22-bookworm

RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg curl unzip && \
    python3 -m pip install --break-system-packages -U "yt-dlp[default]" "bgutil-ytdlp-pot-provider" && \
    curl -fsSL https://deno.land/install.sh | sh && \
    /root/.deno/bin/deno --version && \
    yt-dlp --version && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV PATH="/root/.deno/bin:$PATH"\nENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "node /opt/bgutil-ytdlp-pot-provider/server/build/main.js --host 127.0.0.1 --port 4416 & npm start"]
