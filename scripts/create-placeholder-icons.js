/**
 * Create placeholder icons for PWA
 * Run with: node scripts/create-placeholder-icons.js
 */

const fs = require('fs');
const path = require('path');

// Simple SVG icon (192x192)
const icon192Svg = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#2563eb"/>
  <text x="96" y="110" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">✈</text>
</svg>`;

// Simple SVG icon (512x512)
const icon512Svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#2563eb"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">✈</text>
</svg>`;

// Simple favicon SVG
const faviconSvg = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#2563eb"/>
  <text x="16" y="24" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">✈</text>
</svg>`;

const publicDir = path.join(process.cwd(), 'public');

// Write SVG files (browsers can use SVG as icons)
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), icon192Svg);
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), icon512Svg);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

console.log('✅ Created placeholder SVG icons');
console.log('Note: For production, replace these with actual PNG icons');

