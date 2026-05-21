'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Campaign, TextPosition } from '@/types';
import { Image as ImageIcon } from 'lucide-react';

interface CampaignFramePreviewProps {
  campaign: Campaign;
  className?: string;
}

export default function CampaignFramePreview({ campaign, className = '' }: CampaignFramePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const frameUrl = campaign.frameImageUrl.startsWith('http')
      ? campaign.frameImageUrl
      : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '')}${campaign.frameImageUrl}`;

    img.onload = () => {
      if (!active) return;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError(true);
        setLoading(false);
        return;
      }

      // 1. Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw frame image
      ctx.drawImage(img, 0, 0);

      // Helper function to draw wrapped text matching the main canvas logic
      const drawWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        align: 'left' | 'center' | 'right' = 'left'
      ) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        const maxLines = 2;
        let lineCount = 0;
        const lines: string[] = [];

        for (let i = 0; i < words.length; i++) {
          const testLine = line + words[i] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxWidth && i > 0) {
            lines.push(line.trim());
            line = words[i] + ' ';
            lineCount++;
            if (lineCount >= maxLines) {
              if (i < words.length) {
                lines.push(line.trim() + '...');
              }
              break;
            }
          } else {
            line = testLine;
          }
        }

        if (line.trim()) {
          lines.push(line.trim());
        }

        ctx.textAlign = align;
        ctx.textBaseline = 'top';

        lines.forEach((lineText, index) => {
          let drawX = x;
          if (align === 'center') {
            drawX = x + maxWidth / 2;
          } else if (align === 'right') {
            drawX = x + maxWidth;
          }
          ctx.fillText(lineText, drawX, currentY + index * lineHeight);
        });

        // Reset alignment
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      };

      // 3. Draw text placeholders based on positions in campaign data
      campaign.textPositions.forEach((pos) => {
        if (pos.enabled === false) return;

        const fontSize = pos.fontSize || 48;
        const color = pos.color || '#FFFFFF';
        const fontFamily = pos.fontFamily || 'Arial';

        ctx.font = `${pos.isBold ? 'bold' : ''} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;

        // Shadow configuration for better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        const label = pos.label || (pos.field === 'name' ? 'Name' : pos.field === 'designation' ? 'Designation' : 'Location');
        const placeholderText = `[Your ${label}]`;
        const maxWidth = pos.width || (canvas.width - pos.x - 40);
        const textAlign = pos.textAlign || 'left';

        drawWrappedText(placeholderText, pos.x, pos.y, maxWidth, fontSize, textAlign);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });

      setPreviewUrl(canvas.toDataURL('image/png'));
      setLoading(false);
    };

    img.onerror = () => {
      if (!active) return;
      setError(true);
      setLoading(false);
    };

    img.src = frameUrl;

    return () => {
      active = false;
    };
  }, [campaign]);

  if (loading) {
    return (
      <div className={`aspect-square w-full bg-gray-50 flex items-center justify-center border border-gray-200 rounded-xl overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <span className="text-xs text-gray-500 font-medium">Rendering Template...</span>
        </div>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className={`aspect-square w-full bg-red-50 flex items-center justify-center border border-red-200 rounded-xl overflow-hidden ${className}`}>
        <div className="flex flex-col items-center justify-center text-center p-4">
          <ImageIcon className="w-10 h-10 text-red-400 mb-2" />
          <span className="text-xs text-red-600 font-semibold">Failed to load preview</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`aspect-square w-full relative bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 ${className}`}>
      <img
        src={previewUrl}
        alt={campaign.title}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
