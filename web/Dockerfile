FROM node:22-alpine

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests first for Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173"]
