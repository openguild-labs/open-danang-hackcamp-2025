#!/bin/bash

echo "🧹 Cleaning up frontend structure..."

# Navigate to frontend directory
cd frontend

# Stop any running dev server
pkill -f "next dev" 2>/dev/null || true

# Remove ALL files and directories that might cause conflicts
rm -rf app/ .next/ node_modules/ package-lock.json .turbo/ .cache/ dist/ build/

# Ensure correct directory structure exists
mkdir -p src/app src/config public

echo "📁 Creating clean package.json..."

# Create clean package.json
cat > package.json << 'EOF'
{
  "name": "uniswap-v2-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "ethers": "^6.8.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.51.0",
    "eslint-config-next": "14.2.29",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  }
}
EOF

echo "🎨 Creating clean globals.css..."

# Create clean globals.css
cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  background: #0f172a;
}

* {
  box-sizing: border-box;
}
EOF

echo "📄 Creating layout.tsx..."

# Create layout.tsx
cat > src/app/layout.tsx << 'EOF'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UniswapV2 DEX - Polkadot Asset Hub',
  description: 'Decentralized Exchange for Polkadot Asset Hub',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white">{children}</body>
    </html>
  )
}
EOF

echo "⚙️ Creating Next.js config..."

# Create next.config.js
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {}

module.exports = nextConfig
EOF

echo "🎨 Creating Tailwind config..."

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

echo "📝 Creating PostCSS config..."

# Create postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo "🔗 Creating default contracts config..."

# Create default contracts config
cat > src/config/contracts.json << 'EOF'
{
  "factory": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "tokenA": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "tokenB": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "pair": "0x68F1EF64B6A473E6e782871e4F98B2AaD2bbaD95",
  "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "network": "localhost"
}
EOF

echo "📦 Installing dependencies..."
npm install

echo "✅ Frontend structure fixed!"
echo "🚀 Run 'npm run dev' to start the development server"

# List the final structure
echo ""
echo "📁 Final structure:"
find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.js" -o -name "*.css" | head -20
EOF

chmod +x fix-frontend.sh
