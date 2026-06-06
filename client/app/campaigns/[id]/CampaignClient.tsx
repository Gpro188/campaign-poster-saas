'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { campaignAPI, posterAPI } from '@/lib/api';
import { Campaign, TextPosition, CropShape } from '@/types';
import { Upload, Download, Share2, Image as ImageIcon, Loader, Circle, Square, Triangle, Copy, Check, ZoomIn, ZoomOut, RotateCw, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { encodeShortId } from '@/lib/urlShortener';
import CampaignFramePreview from '@/components/CampaignFramePreview';

interface CampaignClientProps {
  initialCampaign?: Campaign | null;
}

export default function CampaignClient({ initialCampaign = null }: CampaignClientProps) {
  const router = useRouter();
  const params = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [campaign, setCampaign] = useState<Campaign | null>(initialCampaign);
  const [loading, setLoading] = useState(!initialCampaign);
  const [error, setError] = useState('');
  
  // User inputs
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [location, setLocation] = useState('');
  
  // Photo adjustments
  const [photoScale, setPhotoScale] = useState(1);
  const [photoPosition, setPhotoPosition] = useState({ x: 0, y: 0 });
  const [photoRotation, setPhotoRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Touch gesture refs for mobile pinch-to-zoom and dragging
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);
  const touchStartMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartPhotoPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartSingleRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartPhotoPosSingleRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Crop workflow states
  const [step, setStep] = useState<'upload' | 'crop' | 'details' | 'done'>('upload');
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);
  
  const [generating, setGenerating] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [posterGenerated, setPosterGenerated] = useState(false);
  const [generatedPosterBlob, setGeneratedPosterBlob] = useState<Blob | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  // Image Caching for high-performance instant rendering
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [frameLoadingError, setFrameLoadingError] = useState(false);
  const frameImageRef = useRef<HTMLImageElement | null>(null);
  
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const photoImageRef = useRef<HTMLImageElement | null>(null);

  // Live composed poster preview URL state
  const [composedPreviewUrl, setComposedPreviewUrl] = useState<string | null>(null);

  // WhatsApp share message and copy link states
  const [customShareMessage, setCustomShareMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize WhatsApp share message template once campaign is loaded
  useEffect(() => {
    if (campaign && !customShareMessage) {
      const shortId = encodeShortId(campaign._id);
      const cacheBuster = new Date().getTime().toString().slice(-4);
      const campaignUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/c/${shortId}?v=${cacheBuster}` 
        : `/c/${shortId}?v=${cacheBuster}`;
      setCustomShareMessage(
        `*${campaign.title}*\n\n${campaign.description || 'Join the campaign!'}\n\n👉 Create your custom campaign poster now! 👇\n${campaignUrl}`
      );
    }
  }, [campaign, customShareMessage]);

  // Pre-load frame image once when campaign details are loaded
  useEffect(() => {
    if (!campaign) return;
    setFrameLoaded(false);
    setFrameLoadingError(false);
    
    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';
    
    const frameUrl = campaign.frameImageUrl.startsWith('http') 
      ? campaign.frameImageUrl 
      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${campaign.frameImageUrl}`;
    
    console.log('Pre-loading frame from URL:', frameUrl);
    
    frameImg.onload = () => {
      console.log('✅ Frame loaded successfully and cached!', { 
        width: frameImg.width, 
        height: frameImg.height 
      });
      frameImageRef.current = frameImg;
      setFrameLoaded(true);
    };
    
    frameImg.onerror = (err) => {
      console.error('❌ Failed to pre-load frame image:', err);
      setFrameLoadingError(true);
    };
    
    frameImg.src = frameUrl;
  }, [campaign]);

  // Pre-load user photo when photoPreview or croppedPhoto changes
  useEffect(() => {
    const photoToLoad = croppedPhoto || photoPreview;
    if (!photoToLoad) {
      photoImageRef.current = null;
      setPhotoLoaded(false);
      return;
    }
    setPhotoLoaded(false);
    
    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';
    
    photoImg.onload = () => {
      console.log('✅ User photo loaded and cached!');
      photoImageRef.current = photoImg;
      setPhotoLoaded(true);
    };
    
    photoImg.onerror = (err) => {
      console.error('❌ Failed to load user photo:', err);
    };
    
    photoImg.src = photoToLoad;
  }, [photoPreview, croppedPhoto]);

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const data = await campaignAPI.getById(params.id as string);
        setCampaign(data);
      } catch (err: any) {
        console.error('Failed to load live campaign details:', err);
        if (!campaign) {
          setError(err.response?.data?.message || 'Failed to load campaign');
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadCampaign();
    }
  }, [params.id]);

  // Draw canvas instantly using cached images
  useEffect(() => {
    console.log('=== CANVAS USE EFFECT TRIGGERED ===');
    console.log('Campaign:', campaign ? 'YES' : 'NO');
    console.log('Canvas ref:', canvasRef.current ? 'EXISTS' : 'NULL');
    console.log('Frame Loaded:', frameLoaded ? 'YES' : 'NO');
    console.log('Photo Loaded:', photoLoaded ? 'YES' : 'NO');
    
    if (!campaign || !canvasRef.current || !frameLoaded || !frameImageRef.current) {
      console.log('Exiting: Campaign, canvas, or frame image is not ready yet');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Exiting: No 2D context');
      return;
    }

    const frameImg = frameImageRef.current;
    canvas.width = frameImg.width;
    canvas.height = frameImg.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cropShape = (campaign as any).cropShape;
    const hasPhoto = !!croppedPhoto; // Only show photo in the live preview after cropping is confirmed

    if (hasPhoto && photoLoaded && photoImageRef.current) {
      const photoImg = photoImageRef.current;
      
      ctx.save();
      if (croppedPhoto) {
        // Draw confirmed cropped photo directly into the crop area
        if (cropShape) {
          if (cropShape.type === 'circle') {
            const centerX = cropShape.x + cropShape.width / 2;
            const centerY = cropShape.y + cropShape.height / 2;
            const radius = Math.min(cropShape.width, cropShape.height) / 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();
          } else if (cropShape.type === 'triangle') {
            const centerX = cropShape.x + cropShape.width / 2;
            ctx.beginPath();
            ctx.moveTo(centerX, cropShape.y);
            ctx.lineTo(cropShape.x, cropShape.y + cropShape.height);
            ctx.lineTo(cropShape.x + cropShape.width, cropShape.y + cropShape.height);
            ctx.closePath();
            ctx.clip();
          }
          ctx.drawImage(photoImg, cropShape.x, cropShape.y, cropShape.width, cropShape.height);
        } else {
          // Fallback if no crop shape but cropped photo is loaded
          const scale = Math.max(canvas.width / photoImg.width, canvas.height / photoImg.height);
          const scaledWidth = photoImg.width * scale;
          const scaledHeight = photoImg.height * scale;
          const x = (canvas.width - scaledWidth) / 2;
          const y = (canvas.height - scaledHeight) / 2;
          ctx.drawImage(photoImg, x, y, scaledWidth, scaledHeight);
        }
      } else {
        // Dragging preview (prior to confirmation)
        const scaledWidth = photoImg.width * photoScale;
        const scaledHeight = photoImg.height * photoScale;
        ctx.drawImage(
          photoImg,
          photoPosition.x,
          photoPosition.y,
          scaledWidth,
          scaledHeight
        );
      }
      ctx.restore();
      
      // Draw frame overlay
      ctx.drawImage(frameImg, 0, 0);
      
      // Draw text with placeholders = true since we are rendering the preview
      drawText(ctx, canvas, campaign.textPositions, true);
      
      // Draw crop shape guide if campaign has one and we aren't showing the croppedPhoto
      if (cropShape && !croppedPhoto) {
        drawCropShapeGuide(ctx, cropShape);
      }
      
      setCanvasReady(true);
      setComposedPreviewUrl(canvas.toDataURL('image/png'));
      console.log('🎨 Canvas drawing with photo COMPLETE!');
    } else {
      // Just show frame overlay and text
      ctx.drawImage(frameImg, 0, 0);
      drawText(ctx, canvas, campaign.textPositions, true);
      setCanvasReady(true);
      setComposedPreviewUrl(canvas.toDataURL('image/png'));
      console.log('🎨 Canvas drawing frame-only COMPLETE!');
    }
  }, [campaign, frameLoaded, photoPreview, croppedPhoto, photoLoaded, photoScale, photoPosition, name, designation, location, step]);

  // Draw text with wrapping to fit within maxWidth
  const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, initialFontSize: number, align: 'left' | 'center' | 'right' = 'left') => {
      // Auto-scale font size if text is too wide (especially useful for Malayalam)
      let currentFontSize = initialFontSize;
      const originalFontStr = ctx.font;
      let words = text.split(' ');
      
      // Check if any single word is wider than maxWidth
      let needsScaling = false;
      for (const word of words) {
        if (ctx.measureText(word).width > maxWidth) {
          needsScaling = true;
          break;
        }
      }

      if (needsScaling) {
        // Reduce font size until the longest word fits
        while (currentFontSize > 12) {
          currentFontSize -= 2;
          ctx.font = originalFontStr.replace(/\d+px/, `${currentFontSize}px`);
          let fits = true;
          for (const word of words) {
            if (ctx.measureText(word).width > maxWidth) {
              fits = false;
              break;
            }
          }
          if (fits) break;
        }
      }
      
      let line = '';
      let currentY = y;
      const maxLines = 2; // Maximum 2 lines
      let lineCount = 0;
      const lines: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
        // Store current line
        lines.push(line.trim());
        line = words[i] + ' ';
        lineCount++;
        
        // If we've reached max lines, stop
        if (lineCount >= maxLines) {
          // Add ellipsis if there are more words
          if (i < words.length) {
            lines.push(line.trim() + '...');
          }
          break;
        }
      } else {
        line = testLine;
      }
    }
    
    // Add the last line
    if (line.trim()) {
      lines.push(line.trim());
    }
    
    // Draw all lines with proper alignment
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    
    lines.forEach((lineText, index) => {
      let drawX = x;
      
      if (align === 'center') {
        drawX = x + maxWidth / 2;
      } else if (align === 'right') {
        drawX = x + maxWidth;
      }
      
      ctx.fillText(lineText, drawX, currentY + (index * (currentFontSize * 1.2)));
    });
    
    // Reset alignment and font
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = originalFontStr;
  };

  const drawText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, positions: TextPosition[], showPlaceholders: boolean = false) => {
    console.log('drawText called with positions:', positions.length, 'showPlaceholders:', showPlaceholders);
    
    positions.forEach((pos) => {
      if (pos.enabled === false) return;

      let text = '';
      switch (pos.field) {
        case 'name':
          text = name;
          break;
        case 'designation':
          text = designation;
          break;
        case 'location':
          text = location;
          break;
      }

      // Populate placeholder if requested and field is blank
      if (!text && showPlaceholders) {
        text = pos.label ? `[${pos.label}]` : `[Your ${pos.field.charAt(0).toUpperCase() + pos.field.slice(1)}]`;
      }

      // Only draw if text exists
      if (text) {
        const fontSize = pos.fontSize || 48;
        const color = pos.color || '#FFFFFF';
        const fontFamily = pos.fontFamily || 'Arial';
        
        console.log(`Drawing ${pos.field}: "${text}" at (${pos.x}, ${pos.y}), size: ${fontSize}px, color: ${color}`);
        
        ctx.font = `${pos.isBold ? 'bold' : ''} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        
        // Add text shadow for better visibility
        if (pos.hasShadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 3;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }
        
        // Calculate max width (use custom width if set, otherwise use canvas width - x position - margin)
        const maxWidth = pos.width || (canvas.width - pos.x - 40);
        
        // Get text alignment (default to left)
        const textAlign = pos.textAlign || 'left';
        
        // Draw text with wrapping
        drawWrappedText(ctx, text, pos.x, pos.y, maxWidth, fontSize, textAlign);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else {
        console.log(`Skipping ${pos.field}: No text entered`);
      }
    });
  };

  // Draw crop shape guide overlay
  const drawCropShapeGuide = (ctx: CanvasRenderingContext2D, shape: CropShape) => {
    ctx.save();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.globalAlpha = 0.6;
    
    if (shape.type === 'circle') {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'rectangle') {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === 'triangle') {
      const centerX = shape.x + shape.width / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, shape.y);
      ctx.lineTo(shape.x, shape.y + shape.height);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.closePath();
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Apply crop shape to image on download
  const applyCropShape = (ctx: CanvasRenderingContext2D, shape: CropShape) => {
    ctx.save();
    
    if (shape.type === 'circle') {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();
    } else if (shape.type === 'rectangle') {
      ctx.beginPath();
      ctx.rect(shape.x, shape.y, shape.width, shape.height);
      ctx.clip();
    } else if (shape.type === 'triangle') {
      const centerX = shape.x + shape.width / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, shape.y);
      ctx.lineTo(shape.x, shape.y + shape.height);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.closePath();
      ctx.clip();
    }
    
    ctx.restore();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, 'size:', file.size, 'type:', file.type);
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('FileReader completed, setting photo preview');
        setPhotoPreview(reader.result as string);
        // Move to crop step if campaign has crop shape
        if ((campaign as any).cropShape) {
          setStep('crop');
        }
      };
      reader.onerror = (err) => {
        console.error('FileReader error:', err);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle crop confirmation
  const handleCropConfirm = () => {
    if (!photoPreview || !campaign) return;
    
    const cropShape = (campaign as any).cropShape;
    if (!cropShape) {
      // No crop shape, just use original photo
      setCroppedPhoto(photoPreview);
      setStep('details');
      return;
    }

    // Create cropped image using an in-memory canvas
    const canvas = document.createElement('canvas');
    canvas.width = cropShape.width;
    canvas.height = cropShape.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Apply crop shape clipping
      ctx.save();
      if (cropShape.type === 'circle') {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();
      } else if (cropShape.type === 'triangle') {
        const centerX = canvas.width / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(0, canvas.height);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.clip();
      }

      // Calculate scale and position to fit photo in crop area
      const scaleX = cropShape.width / img.width;
      const scaleY = cropShape.height / img.height;
      const scale = Math.max(scaleX, scaleY) * photoScale;
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      const x = (cropShape.width - scaledWidth) / 2 + photoPosition.x;
      const y = (cropShape.height - scaledHeight) / 2 + photoPosition.y;

      // Draw cropped image with rotation
      ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2);
      ctx.rotate((photoRotation * Math.PI) / 180);
      ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
      ctx.restore();

      // Save cropped photo
      const croppedDataUrl = canvas.toDataURL('image/png');
      setCroppedPhoto(croppedDataUrl);
      setStep('details');
    };
    img.src = photoPreview;
  };

  // Auto-scroll to crop container when step transitions to 'crop'
  useEffect(() => {
    if (step === 'crop') {
      const timer = setTimeout(() => {
        const cropContainer = document.getElementById('crop-section-container');
        if (cropContainer) {
          cropContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150); // Small delay to ensure render is complete
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Draw photo on crop canvas when step changes to 'crop'
  useEffect(() => {
    if (step === 'crop' && photoPreview && cropCanvasRef.current && campaign) {
      const canvas = cropCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropShape = (campaign as any).cropShape;
      if (!cropShape) {
        // No crop shape, show full photo
        const img = new Image();
        img.onload = () => {
          canvas.width = Math.min(img.width, 600);
          canvas.height = (canvas.width / img.width) * img.height;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = photoPreview;
        return;
      }

      const PADDING = 60;
      // Set canvas to crop shape size plus padding
      canvas.width = cropShape.width + PADDING * 2;
      canvas.height = cropShape.height + PADDING * 2;

      // Draw photo with current position, scale and rotation
      const img = new Image();
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. Draw photo (unclipped, so visitor sees what's being cropped out)
        ctx.save();
        
        const scaleX = cropShape.width / img.width;
        const scaleY = cropShape.height / img.height;
        const scale = Math.max(scaleX, scaleY) * photoScale;
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        const cropCenterX = PADDING + cropShape.width / 2;
        const cropCenterY = PADDING + cropShape.height / 2;
        
        const drawX = cropCenterX - scaledWidth / 2 + photoPosition.x;
        const drawY = cropCenterY - scaledHeight / 2 + photoPosition.y;
        
        // Move to photo center, rotate, and draw centered
        ctx.translate(drawX + scaledWidth / 2, drawY + scaledHeight / 2);
        ctx.rotate((photoRotation * Math.PI) / 180);
        ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        ctx.restore();

        // 2. Draw semi-transparent dark overlay over the cropped-out areas
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'; // Sleek slate-900 transparent overlay
        
        ctx.beginPath();
        // Outer rectangle (covers entire canvas)
        ctx.rect(0, 0, canvas.width, canvas.height);
        
        // Inner crop shape drawn counter-clockwise to exclude it from the overlay fill (evenodd rule)
        if (cropShape.type === 'circle') {
          const centerX = PADDING + cropShape.width / 2;
          const centerY = PADDING + cropShape.height / 2;
          const radius = Math.min(cropShape.width, cropShape.height) / 2;
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        } else if (cropShape.type === 'triangle') {
          const centerX = PADDING + cropShape.width / 2;
          ctx.moveTo(centerX, PADDING);
          ctx.lineTo(PADDING, PADDING + cropShape.height);
          ctx.lineTo(PADDING + cropShape.width, PADDING + cropShape.height);
          ctx.closePath();
        } else {
          // Rectangle counter-clockwise
          ctx.rect(PADDING + cropShape.width, PADDING, -cropShape.width, cropShape.height);
        }
        
        ctx.fill('evenodd');
        ctx.restore();

        // 3. Draw shape outline guide
        ctx.save();
        ctx.strokeStyle = '#10B981'; // Emerald color matching theme
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        
        if (cropShape.type === 'circle') {
          const centerX = PADDING + cropShape.width / 2;
          const centerY = PADDING + cropShape.height / 2;
          const radius = Math.min(cropShape.width, cropShape.height) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (cropShape.type === 'triangle') {
          const centerX = PADDING + cropShape.width / 2;
          ctx.beginPath();
          ctx.moveTo(centerX, PADDING);
          ctx.lineTo(PADDING, PADDING + cropShape.height);
          ctx.lineTo(PADDING + cropShape.width, PADDING + cropShape.height);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(PADDING, PADDING, cropShape.width, cropShape.height);
        }
        ctx.restore();
      };
      img.src = photoPreview;
    }
  }, [step, photoPreview, photoScale, photoPosition, photoRotation, campaign]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!photoPreview || !cropCanvasRef.current) return;
    
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !cropCanvasRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;
    
    // Use requestAnimationFrame for smoother performance
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      setPhotoPosition((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      
      setDragStart({ x: currentX, y: currentY });
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Dedicated mobile touch gesture handlers for smooth drag & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!photoPreview || !cropCanvasRef.current) return;
    
    // Prevent default scroll behaviors on the crop canvas
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (e.touches.length === 1) {
      // Single touch: Drag/Pan photo
      touchStartSingleRef.current = {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
      touchStartPhotoPosSingleRef.current = { ...photoPosition };
      
      // Reset pinch zoom state refs
      touchStartDistRef.current = null;
      touchStartMidpointRef.current = null;
    } else if (e.touches.length === 2) {
      // Two-finger pinch: Zoom and optional center movement
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = photoScale;
      
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      touchStartMidpointRef.current = {
        x: midX - rect.left,
        y: midY - rect.top
      };
      touchStartPhotoPosRef.current = { ...photoPosition };
      
      // Reset single touch drag state refs
      touchStartSingleRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!photoPreview || !cropCanvasRef.current) return;
    
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    
    if (e.touches.length === 1) {
      // Single touch: Smooth drag calculation
      if (!touchStartSingleRef.current) {
        touchStartSingleRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
        touchStartPhotoPosSingleRef.current = { ...photoPosition };
      }
      
      const curX = e.touches[0].clientX - rect.left;
      const curY = e.touches[0].clientY - rect.top;
      const dx = curX - touchStartSingleRef.current.x;
      const dy = curY - touchStartSingleRef.current.y;
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setPhotoPosition({
          x: touchStartPhotoPosSingleRef.current.x + dx,
          y: touchStartPhotoPosSingleRef.current.y + dy
        });
      });
      
    } else if (e.touches.length === 2) {
      // Two-finger pinch to zoom & move
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      
      if (touchStartDistRef.current === null) {
        touchStartDistRef.current = currentDist;
        touchStartScaleRef.current = photoScale;
        
        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        touchStartMidpointRef.current = {
          x: midX - rect.left,
          y: midY - rect.top
        };
        touchStartPhotoPosRef.current = { ...photoPosition };
      }
      
      const scaleFactor = currentDist / touchStartDistRef.current;
      const newScale = Math.min(3, Math.max(0.1, touchStartScaleRef.current * scaleFactor));
      
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;
      const currentMid = {
        x: midX - rect.left,
        y: midY - rect.top
      };
      
      let dx = 0;
      let dy = 0;
      if (touchStartMidpointRef.current) {
        dx = currentMid.x - touchStartMidpointRef.current.x;
        dy = currentMid.y - touchStartMidpointRef.current.y;
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(() => {
        setPhotoScale(Number(newScale.toFixed(2)));
        setPhotoPosition({
          x: touchStartPhotoPosRef.current.x + dx,
          y: touchStartPhotoPosRef.current.y + dy
        });
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    // Reset touch refs to prevent jumpiness on subsequent touches
    touchStartSingleRef.current = null;
    touchStartDistRef.current = null;
    touchStartMidpointRef.current = null;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleDownload = async () => {
    if (!canvasRef.current || !campaign) return;
    
    if (!croppedPhoto && !photoPreview) {
      alert('Please upload a photo first!');
      return;
    }
    
    if (!name) {
      alert('Please enter your name!');
      return;
    }
    
    setGenerating(true);
    
    try {
      const blob = await generatePoster();
      
      if (!blob) {
        alert('Failed to generate poster. Please try again.');
        return;
      }
      
      const fileName = `campaign-poster-${name}.png`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
          alert('Please allow popups to download your poster.');
        } else {
          setTimeout(() => {
            alert('Your poster is ready!\n\nLong-press the image and select "Save to Photos" or "Save Image".');
          }, 1000);
        }
        
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (isMobile) {
          alert('Poster downloaded! Check your Downloads folder.');
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      alert('Failed to save poster. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Generate poster and save to backend (with showPlaceholders = false)
  const generatePoster = async (): Promise<Blob | null> => {
    if (!canvasRef.current || !campaign) return null;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    console.log('Generating final poster...');
    
    // Use cached frame image if available, otherwise load it
    const frameImg = frameImageRef.current || new Image();
    if (!frameImageRef.current) {
      const frameUrl = campaign.frameImageUrl.startsWith('http') 
        ? campaign.frameImageUrl 
        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${campaign.frameImageUrl}`;
      
      console.log('Generating poster - loading frame from URL:', frameUrl);
      frameImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        frameImg.onload = resolve;
        frameImg.onerror = reject;
        frameImg.src = frameUrl;
      });
    } else {
      console.log('Generating poster - using cached frame image');
    }

    // Set canvas to frame dimensions
    canvas.width = frameImg.width;
    canvas.height = frameImg.height;

    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cropped photo (or original if no crop)
    const photoToUse = croppedPhoto || photoPreview;
    if (photoToUse) {
      let photoImg = new Image();
      
      if (croppedPhoto) {
        photoImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          photoImg.onload = resolve;
          photoImg.onerror = reject;
          photoImg.src = croppedPhoto;
        });
      } else if (photoImageRef.current) {
        photoImg = photoImageRef.current;
        console.log('Generating poster - using cached user photo');
      } else {
        photoImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          photoImg.onload = resolve;
          photoImg.onerror = reject;
          photoImg.src = photoToUse;
        });
      }

      const cropShape = (campaign as any).cropShape;
      
      if (cropShape) {
        ctx.save();
        // Apply crop shape clipping
        if (cropShape.type === 'circle') {
          const centerX = cropShape.x + cropShape.width / 2;
          const centerY = cropShape.y + cropShape.height / 2;
          const radius = Math.min(cropShape.width, cropShape.height) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();
        } else if (cropShape.type === 'triangle') {
          const centerX = cropShape.x + cropShape.width / 2;
          ctx.beginPath();
          ctx.moveTo(centerX, cropShape.y);
          ctx.lineTo(cropShape.x, cropShape.y + cropShape.height);
          ctx.lineTo(cropShape.x + cropShape.width, cropShape.y + cropShape.height);
          ctx.closePath();
          ctx.clip();
        }
        
        ctx.drawImage(photoImg, cropShape.x, cropShape.y, cropShape.width, cropShape.height);
        ctx.restore();
      } else {
        const scale = Math.max(canvas.width / photoImg.width, canvas.height / photoImg.height);
        const scaledWidth = photoImg.width * scale;
        const scaledHeight = photoImg.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        ctx.drawImage(photoImg, x, y, scaledWidth, scaledHeight);
      }
    }

    // Draw frame overlay
    ctx.drawImage(frameImg, 0, 0);

    // Draw text (showPlaceholders = false for final image)
    drawText(ctx, canvas, campaign.textPositions, false);

    console.log('Poster generated successfully!');
    
    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty or blob is invalid'));
        }
      }, 'image/png', 1.0);
    });
    
    console.log('Poster blob created:', { size: blob.size, type: blob.type });
    
    // Save poster to backend
    const posterFile = new File([blob], `campaign-poster-${name}.png`, { type: 'image/png' });
    
    try {
      const formData = new FormData();
      formData.append('campaignId', campaign._id);
      formData.append('supporterName', name);
      formData.append('designation', designation);
      formData.append('location', location);
      formData.append('photo', posterFile);
      
      await posterAPI.create(formData);
      console.log('Poster saved to backend successfully');
      // Immediately update local poster count state
      setCampaign(prev => prev ? { ...prev, posterCount: (prev.posterCount || 0) + 1 } : null);
    } catch (saveErr) {
      console.warn('Failed to save poster to backend:', saveErr);
    }
    
    return blob;
  };

  const handleWhatsAppCampaignShare = () => {
    if (!campaign) return;
    const encodedMessage = encodeURIComponent(customShareMessage);
    const url = `https://wa.me/?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  const handleCopyCampaignLink = () => {
    if (!campaign) return;
    const shortId = encodeShortId(campaign._id);
    const campaignUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/c/${shortId}` 
      : `/c/${shortId}`;
    
    navigator.clipboard.writeText(campaignUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
      });
  };

  const handleShareWhatsApp = async () => {
    if (!campaign || !name) {
      alert('Please enter your name first!');
      return;
    }
    
    if (!croppedPhoto && !photoPreview) {
      alert('Please upload a photo first!');
      return;
    }
    
    setGenerating(true);
    
    try {
      const blob = await generatePoster();
      
      if (!blob) {
        alert('Failed to generate poster. Please try again.');
        return;
      }
      
      setGeneratedPosterBlob(blob);
      setPosterGenerated(true);
    } catch (err: any) {
      console.error('Error:', err);
      alert('Failed to generate poster. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 flex flex-col items-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-50 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-emerald-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center animate-bounce">
              <span className="text-xl">🚀</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Connecting to Campaign Server</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Please wait a moment while we retrieve the campaign details...
          </p>
          
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-left">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-semibold text-emerald-950 mb-0.5">First visit wake-up</p>
                <p className="text-xs text-emerald-800 leading-normal">
                  Our backend uses a free hosting tier that falls asleep after inactivity. Waking it up might take 30 to 50 seconds. Thank you for your patience!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-md border border-gray-100 max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Campaign</h2>
          <p className="text-gray-600 mb-6 text-sm">{error || 'Campaign not found or inactive.'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm shadow-emerald-600/10"
          >
            Return to Dpro Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 flex flex-col justify-between">
      <div className={`${step === 'upload' ? 'max-w-5xl' : 'max-w-4xl'} mx-auto px-4 w-full flex-grow transition-all duration-300`}>
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-block mb-3">
            Supporter Campaign Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-10">
          <div className="flex items-center gap-2 sm:gap-4 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100">
            {['Upload', 'Crop', 'Details', 'Download'].map((stepName, idx) => {
              const stepNames = ['upload', 'crop', 'details', 'done'];
              const currentIdx = stepNames.indexOf(step);
              const isActive = idx <= currentIdx;
              const isCurrent = stepNames[idx] === step || (idx === 3 && step === 'done');
              return (
                <React.Fragment key={stepName}>
                  {idx > 0 && (
                    <div className={`w-6 sm:w-12 h-0.5 transition-colors duration-300 ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  )}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' 
                        : isActive 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-gray-200 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-xs font-semibold transition-colors duration-300 hidden md:inline ${
                      isActive ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {stepName}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Left Column: Frame Preview & Campaign Stats (5 Cols on Large Screen) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Template Preview Container */}
              <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-emerald-600">🎨</span> Poster Template Preview
                </h3>
                <CampaignFramePreview 
                  campaign={campaign} 
                  className="rounded-xl overflow-hidden shadow-inner border border-gray-100 bg-slate-50" 
                />
              </div>

              {/* Campaign Stats Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-6 rounded-2xl border border-emerald-100 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">Campaign Tracker</h4>
                    <p className="text-xs text-emerald-800/80 font-medium">Real-time supporter stats</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100/60 shadow-sm">
                    <span className="text-[10px] sm:text-xs text-emerald-900/60 font-bold uppercase tracking-wider block mb-1">
                      Visitors
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-950">
                      {campaign.posterCount || 0}
                    </span>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-100/60 shadow-sm flex flex-col justify-center">
                    <span className="text-[10px] sm:text-xs text-emerald-900/60 font-bold uppercase tracking-wider block mb-1">
                      Status
                    </span>
                    <span className="text-sm font-bold text-emerald-700 capitalize flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Upload Box & WhatsApp sharing (7 Cols on Large Screen) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Existing Upload Area */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 flex flex-col justify-center text-center">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Create Your Custom Poster</h2>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  Support the campaign in just 3 simple steps. Click below to upload your photo, crop it to fit, and add your name.
                </p>
                
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100/60 hover:border-emerald-500 transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="mb-1 text-sm font-semibold text-gray-700">
                      Click to upload your photo
                    </p>
                    <p className="text-xs text-gray-400">PNG, JPG or WEBP (Max 5MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* WhatsApp Sharing Widget */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-gray-800 font-bold text-base">
                  <span className="text-xl">📢</span>
                  <span>Spread the Word!</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Customize the invite message below and share this campaign directly to WhatsApp groups and chats to help spread the word!
                </p>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Invite Message
                  </label>
                  <textarea
                    value={customShareMessage}
                    onChange={(e) => setCustomShareMessage(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none font-mono bg-slate-50/50 text-gray-700"
                    placeholder="Enter message to share..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={handleWhatsAppCampaignShare}
                    className="flex-1 bg-[#25D366] hover:bg-[#20ba56] text-white py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Share on WhatsApp
                  </button>
                  <button
                    onClick={handleCopyCampaignLink}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all min-w-[130px]"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Crop */}
        {step === 'crop' && (
          <div id="crop-section-container" className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 max-w-xl mx-auto scroll-mt-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Adjust Your Photo</h2>
            <p className="text-center text-gray-500 mb-6 text-sm">
              Drag your photo or use the controls below to position, zoom, and rotate it perfectly.
            </p>
            
            {/* Crop Canvas */}
            <div className="mb-6 flex justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <canvas
                ref={cropCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="border border-gray-200 rounded-xl cursor-move shadow-md max-w-full"
                style={{ 
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              />
            </div>

            {/* Control Panel Groups */}
            <div className="space-y-6 mb-8">
              {/* Zoom & Slider Control */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    🔍 Zoom Scale
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                    {Math.round(photoScale * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPhotoScale(prev => Math.max(0.1, Number((prev - 0.1).toFixed(2))))}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm text-slate-600 transition-colors flex items-center justify-center"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.05"
                    value={photoScale}
                    onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                    className="flex-grow h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoScale(prev => Math.min(3, Number((prev + 0.1).toFixed(2))))}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm text-slate-600 transition-colors flex items-center justify-center"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid for Rotation & Positioning */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rotate Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      🔄 Rotate Photo
                    </span>
                    <p className="text-gray-400 text-[11px] mb-4">
                      Correct the orientation of mobile phone photos.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoRotation(prev => (prev - 90 + 360) % 360)}
                      className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Rotate CCW
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoRotation(prev => (prev + 90) % 360)}
                      className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate CW
                    </button>
                  </div>
                </div>

                {/* Fine-Tune Position Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
                  <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 self-start">
                    🎯 Fine-Tune Position
                  </span>
                  
                  {/* D-Pad Controller */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Up Button */}
                    <button
                      type="button"
                      onClick={() => setPhotoPosition(prev => ({ ...prev, y: prev.y - 8 }))}
                      className="absolute top-0 w-8 h-8 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 transition-all active:scale-90"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    
                    {/* Left Button */}
                    <button
                      type="button"
                      onClick={() => setPhotoPosition(prev => ({ ...prev, x: prev.x - 8 }))}
                      className="absolute left-0 w-8 h-8 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 transition-all active:scale-90"
                      title="Move Left"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {/* Reset Button (Center) */}
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPosition({ x: 0, y: 0 });
                        setPhotoScale(1);
                        setPhotoRotation(0);
                      }}
                      className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-600 transition-all active:scale-90 shadow-inner"
                      title="Reset Adjustment"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Right Button */}
                    <button
                      type="button"
                      onClick={() => setPhotoPosition(prev => ({ ...prev, x: prev.x + 8 }))}
                      className="absolute right-0 w-8 h-8 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 transition-all active:scale-90"
                      title="Move Right"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Down Button */}
                    <button
                      type="button"
                      onClick={() => setPhotoPosition(prev => ({ ...prev, y: prev.y + 8 }))}
                      className="absolute bottom-0 w-8 h-8 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 transition-all active:scale-90"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tip Box */}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100/60 text-left text-xs leading-relaxed text-emerald-800 flex items-start gap-2.5 shadow-sm">
                <span className="text-base leading-none">💡</span>
                <div>
                  <span className="font-bold text-emerald-950 block mb-0.5">Quick Cropping Tip</span>
                  You can click/tap and drag the photo directly inside the preview above to move it around, then zoom and rotate it using these controls.
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 font-medium transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md shadow-emerald-600/10"
              >
                Confirm & Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && !posterGenerated && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-xl mx-auto">
            <div className="p-8 flex flex-col justify-center text-center">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Customize Details</h2>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  Fill out the fields below to add your details to the campaign poster.
                </p>

                <div className="space-y-4">
                  {campaign.textPositions
                    .filter((pos) => pos.enabled !== false) // Only show enabled fields
                    .map((pos) => {
                      const isName = pos.field === 'name';
                      const isDesignation = pos.field === 'designation';
                      const isLocation = pos.field === 'location';
                      
                      const value = isName ? name : isDesignation ? designation : location;
                      const setValue = isName ? setName : isDesignation ? setDesignation : setLocation;
                      
                      const label = pos.label || (isName ? 'Name' : isDesignation ? 'Designation' : 'Location');
                      const placeholder = isName ? 'Enter your name' : isDesignation ? 'e.g., Volunteer, Supporter' : 'e.g., New York, USA';
                      const required = isName; // Only name is required
                      
                      return (
                        <div key={pos.field} className="text-left">
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {label} {required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-900"
                            placeholder={placeholder}
                            required={required}
                          />
                        </div>
                      );
                    })}
                </div>

                <div className="space-y-3 mt-8">
                  <button
                    onClick={async () => {
                      const nameFieldEnabled = campaign.textPositions.some(
                        (pos) => pos.field === 'name' && pos.enabled !== false
                      );
                      
                      if (nameFieldEnabled && !name) {
                        alert('Please enter your name!');
                        return;
                      }
                      
                      if (!croppedPhoto && !photoPreview) {
                        alert('Please upload a photo first!');
                        return;
                      }
                      
                      setGenerating(true);
                      
                      try {
                        const blob = await generatePoster();
                        
                        if (!blob) {
                          alert('Failed to generate poster. Please try again.');
                          return;
                        }
                        
                        setGeneratedPosterBlob(blob);
                        setPosterGenerated(true);
                      } catch (err: any) {
                        console.error('Error:', err);
                        alert('Failed to generate poster. Please try again.');
                      } finally {
                        setGenerating(false);
                      }
                    }}
                    disabled={(() => {
                      const nameFieldEnabled = campaign.textPositions.some(
                        (pos) => pos.field === 'name' && pos.enabled !== false
                      );
                      return (nameFieldEnabled && !name) || generating || (!croppedPhoto && !photoPreview);
                    })()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20"
                  >
                    {generating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Generating Poster...
                      </>
                    ) : (
                      'Submit & Generate Poster'
                    )}
                  </button>

                  <button
                    onClick={() => setStep('crop')}
                    className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 font-medium transition-all"
                  >
                    ← Back to Crop
                  </button>
                </div>
              </div>
            </div>
        )}

        {/* Thank You / Done Screen */}
        {posterGenerated && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-xl mx-auto border border-gray-100">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Thank You!</h2>
              <p className="text-base text-gray-500">Thanks for joining the campaign! 🎉</p>
              <p className="text-sm text-gray-400 mt-1">Your custom poster is ready to share.</p>
            </div>

            {/* Poster Preview */}
            {generatedPosterBlob && (
              <div className="mb-8 relative max-w-[320px] mx-auto rounded-xl shadow-lg border border-gray-200 overflow-hidden bg-gray-50">
                <img
                  src={URL.createObjectURL(generatedPosterBlob)}
                  alt="Your Custom Campaign Poster"
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 max-w-md mx-auto">
              <button
                onClick={async () => {
                  if (!generatedPosterBlob) return;
                  
                  const fileName = `campaign-poster-${name}.png`;
                  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
                  
                  if (isIOS) {
                    const url = URL.createObjectURL(generatedPosterBlob);
                    const newWindow = window.open(url, '_blank');
                    if (!newWindow) {
                      alert('Please allow popups to download your poster.');
                    } else {
                      setTimeout(() => {
                        alert('Your poster is ready!\n\nLong-press the image and select "Save to Photos" or "Save Image".');
                      }, 1000);
                    }
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  } else {
                    const url = URL.createObjectURL(generatedPosterBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20"
              >
                <Download className="w-5 h-5" />
                Download Poster
              </button>

              <button
                onClick={async () => {
                  if (!generatedPosterBlob || !campaign) return;
                  
                  const shortId = encodeShortId(campaign._id);
                  const campaignUrl = `${window.location.origin}/c/${shortId}`;
                  const file = new File([generatedPosterBlob], 'campaign-poster.png', { type: 'image/png' });
                  
                  if (navigator.share && navigator.canShare({ files: [file] })) {
                    try {
                      await navigator.share({
                        files: [file],
                        title: campaign.title,
                        text: `*${campaign.title}*\n\n${campaign.description || ''}\n\nCreate your campaign poster now!\n\n${campaignUrl}`,
                      });
                      return;
                    } catch (err) {
                      console.log('Share cancelled, falling back to text-only');
                    }
                  }
                  
                  const message = encodeURIComponent(
                    `*${campaign.title}*\n\n${campaign.description || 'Join the campaign!'}\n\n👉 Create your campaign poster now! 👇\n${campaignUrl}`
                  );
                  const url = `https://wa.me/?text=${message}`;
                  window.open(url, '_blank');
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </button>

              <button
                onClick={() => {
                  setPosterGenerated(false);
                  setGeneratedPosterBlob(null);
                  setStep('details');
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
              >
                ← Back to Edit
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for final poster generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* WhatsApp Help Button and Copyright Footer */}
      <div className="mt-12 mb-4 text-center space-y-4">
        <a
          href="https://wa.me/918592888137"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-full hover:bg-emerald-700 font-semibold text-sm transition-all shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 duration-200"
        >
          <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Need Help? Contact on WhatsApp
        </a>
        <p className="text-xs text-gray-400">
          © 2026 Dpro Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
}
