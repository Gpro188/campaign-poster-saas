'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { campaignAPI, posterAPI } from '@/lib/api';
import { Campaign, TextPosition, CropShape } from '@/types';
import { Upload, Download, Share2, Image as ImageIcon, Loader, Circle, Square, Triangle } from 'lucide-react';
import { encodeShortId } from '@/lib/urlShortener';

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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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
    if (campaign) return; // Skip if pre-fetched on server
    const loadCampaign = async () => {
      try {
        const data = await campaignAPI.getById(params.id as string);
        setCampaign(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadCampaign();
    }
  }, [params.id, campaign]);

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
  const drawWrappedText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, align: 'left' | 'center' | 'right' = 'left') => {
    const words = text.split(' ');
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
      
      ctx.fillText(lineText, drawX, currentY + (index * lineHeight));
    });
    
    // Reset alignment
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
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
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
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
    if (!cropCanvasRef.current || !photoPreview || !campaign) return;
    
    const cropShape = (campaign as any).cropShape;
    if (!cropShape) {
      // No crop shape, just use original photo
      setCroppedPhoto(photoPreview);
      setStep('details');
      return;
    }

    // Create cropped image
    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas to crop shape dimensions
      canvas.width = cropShape.width;
      canvas.height = cropShape.height;

      // Apply crop shape clipping
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
      // Rectangle doesn't need special clipping

      // Calculate scale and position to fit photo in crop area
      const scaleX = cropShape.width / img.width;
      const scaleY = cropShape.height / img.height;
      const scale = Math.max(scaleX, scaleY) * photoScale;
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (cropShape.width - scaledWidth) / 2 + photoPosition.x;
      const y = (cropShape.height - scaledHeight) / 2 + photoPosition.y;

      // Draw cropped image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // Save cropped photo
      const croppedDataUrl = canvas.toDataURL('image/png');
      setCroppedPhoto(croppedDataUrl);
      setStep('details');
    };
    img.src = photoPreview;
  };

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

      // Set canvas to crop shape size
      canvas.width = cropShape.width;
      canvas.height = cropShape.height;

      // Draw photo with current position and scale
      const img = new Image();
      img.onload = () => {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw shape outline guide
        ctx.save();
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        if (cropShape.type === 'circle') {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(canvas.width, canvas.height) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (cropShape.type === 'triangle') {
          const centerX = canvas.width / 2;
          ctx.beginPath();
          ctx.moveTo(centerX, 0);
          ctx.lineTo(0, canvas.height);
          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }
        ctx.restore();

        // Apply clipping for shape
        if (cropShape.type === 'circle') {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(canvas.width, canvas.height) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();
        } else if (cropShape.type === 'triangle') {
          const centerX = canvas.width / 2;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX, 0);
          ctx.lineTo(0, canvas.height);
          ctx.lineTo(canvas.width, canvas.height);
          ctx.closePath();
          ctx.clip();
        }

        // Calculate photo position and scale
        const scaleX = cropShape.width / img.width;
        const scaleY = cropShape.height / img.height;
        const scale = Math.max(scaleX, scaleY) * photoScale;
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (cropShape.width - scaledWidth) / 2 + photoPosition.x;
        const y = (cropShape.height - scaledHeight) / 2 + photoPosition.y;

        // Draw photo
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        ctx.restore();
      };
      img.src = photoPreview;
    }
  }, [step, photoPreview, photoScale, photoPosition, campaign]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!photoPreview || !cropCanvasRef.current) return;
    
    // Prevent default to stop scrolling on mobile
    if ('touches' in e) {
      e.preventDefault();
    }
    
    setIsDragging(true);
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !cropCanvasRef.current) return;
    
    if ('touches' in e) {
      e.preventDefault();
    }
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;
    
    const dx = currentX - dragStart.x;
    const dy = currentY - dragStart.y;
    
    // Use requestAnimationFrame for smoother performance on mobile
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
    } catch (saveErr) {
      console.warn('Failed to save poster to backend:', saveErr);
    }
    
    return blob;
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
      <div className="max-w-4xl mx-auto px-4 w-full flex-grow">
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
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Column: Interactive Poster Frame Preview */}
              <div className="md:col-span-5 bg-gray-50/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 block">Poster Design Template</span>
                <div className="relative w-full max-w-[280px] aspect-square rounded-xl shadow-md overflow-hidden bg-white border border-gray-200">
                  {composedPreviewUrl ? (
                    <img 
                      src={composedPreviewUrl} 
                      alt="Campaign Frame Preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                      <Loader className="w-8 h-8 animate-spin mb-2 text-emerald-500" />
                      <span className="text-xs">Loading poster framework...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Upload Controls & Info */}
              <div className="md:col-span-7 p-8 flex flex-col justify-center">
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
            </div>
          </div>
        )}

        {/* Step 2: Crop */}
        {step === 'crop' && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Adjust Your Photo</h2>
            <p className="text-center text-gray-500 mb-6 text-sm">
              Drag your photo or use the slider below to position it perfectly inside the crop area.
            </p>
            
            {/* Crop Canvas */}
            <div className="mb-6 flex justify-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <canvas
                ref={cropCanvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onTouchStart={handleCanvasMouseDown}
                onTouchMove={handleCanvasMouseMove}
                onTouchEnd={handleCanvasMouseUp}
                onTouchCancel={handleCanvasMouseUp}
                className="border border-gray-200 rounded-xl cursor-move shadow-md max-w-full"
                style={{ 
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              />
            </div>

            {/* Scale Control */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                <span>Scale Adjust</span>
                <span>{Math.round(photoScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={photoScale}
                onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
              />
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
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Left Column: Live Composed Poster Preview */}
              <div className="md:col-span-5 bg-gray-50/50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 block">Live Poster Preview</span>
                <div className="relative w-full max-w-[280px] aspect-square rounded-xl shadow-md overflow-hidden bg-white border border-gray-200">
                  {composedPreviewUrl ? (
                    <img 
                      src={composedPreviewUrl} 
                      alt="Your Campaign Poster Preview" 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                      <Loader className="w-8 h-8 animate-spin mb-2 text-emerald-500" />
                      <span className="text-xs">Generating preview...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Information Input Form */}
              <div className="md:col-span-7 p-8 flex flex-col justify-center">
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-2">Customize Details</h2>
                <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                  Fill out the fields below. The poster preview on the left will update in real time as you type!
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
                        <div key={pos.field}>
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

      {/* WhatsApp Help Button placed cleanly at the bottom */}
      <div className="mt-12 mb-4 text-center">
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
      </div>
    </div>
  );
}
