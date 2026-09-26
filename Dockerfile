FROM node:22-bookworm

RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    python3 -m pip install --break-system-packages -U yt-dlp && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
