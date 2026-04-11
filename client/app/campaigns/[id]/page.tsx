'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { campaignAPI, posterAPI } from '@/lib/api';
import { Campaign, TextPosition, CropShape } from '@/types';
import { Upload, Download, Share2, Image as ImageIcon, Loader, Circle, Square, Triangle } from 'lucide-react';

export default function CampaignPage() {
  const router = useRouter();
  const params = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
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
  const animationFrameRef = useRef<number | null>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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
  }, [params.id]);

  // Draw canvas when photo is uploaded or campaign loads
  useEffect(() => {
    console.log('=== CANVAS USE EFFECT TRIGGERED ===');
    console.log('Campaign:', campaign ? 'YES' : 'NO');
    console.log('Canvas ref:', canvasRef.current ? 'EXISTS' : 'NULL');
    console.log('Photo preview:', photoPreview ? 'EXISTS' : 'NULL');
    console.log('Name:', name, 'Designation:', designation, 'Location:', location);
    
    if (!campaign || !canvasRef.current) {
      console.log('Exiting: No campaign or canvas');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Exiting: No 2D context');
      return;
    }

    // Load frame image from backend
    const frameImg = new Image();
    frameImg.crossOrigin = 'anonymous';
    // Remove /api/ prefix - backend serves static files directly at /uploads
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const frameUrl = `${baseUrl}${campaign.frameImageUrl}`;
    
    console.log('Loading frame from URL:', frameUrl);
    console.log('Campaign frameImageUrl:', campaign.frameImageUrl);
    console.log('Base URL used:', baseUrl);
    
    // Test if URL is accessible
    fetch(frameUrl, { method: 'HEAD' })
      .then(response => {
        console.log('Frame URL HEAD request status:', response.status, response.ok);
        if (!response.ok) {
          console.error('Frame URL is not accessible! Status:', response.status);
        }
      })
      .catch(err => {
        console.error('Frame URL HEAD request failed:', err);
        console.log('This might be a CORS issue or the file does not exist');
      });
    
    frameImg.onload = () => {
      console.log('✅ Frame loaded successfully!', { 
        width: frameImg.width, 
        height: frameImg.height 
      });
      
      canvas.width = frameImg.width;
      canvas.height = frameImg.height;

      if (photoPreview) {
        console.log('Drawing with photo...');
        const photoImg = new Image();
        photoImg.crossOrigin = 'anonymous';
        photoImg.src = photoPreview;
        
        photoImg.onload = () => {
          console.log('✅ Photo loaded, starting to draw...');
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw white background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          console.log('Drew white background');
          
          // Draw user photo
          const scaledWidth = photoImg.width * photoScale;
          const scaledHeight = photoImg.height * photoScale;
          
          console.log('Drawing photo with scale:', photoScale, 'dimensions:', { x: photoPosition.x, y: photoPosition.y, w: scaledWidth, h: scaledHeight });
          
          ctx.drawImage(
            photoImg,
            photoPosition.x,
            photoPosition.y,
            scaledWidth,
            scaledHeight
          );
          console.log('Drew photo');
          
          // Draw frame overlay
          ctx.drawImage(frameImg, 0, 0);
          console.log('Drew frame overlay');
          
          // Draw text - ALWAYS draw text if it exists
          console.log('Drawing text with values:', { name, designation, location });
          drawText(ctx, campaign.textPositions);
          console.log('Drew text');
          
          // Draw crop shape guide if campaign has one
          if ((campaign as any).cropShape) {
            console.log('Drawing crop shape guide:', (campaign as any).cropShape);
            drawCropShapeGuide(ctx, (campaign as any).cropShape);
          }
          
          console.log('🎨 Canvas drawing COMPLETE!');
          setCanvasReady(true);
        };
        
        photoImg.onerror = (err) => {
          console.error('❌ Failed to load photo image:', err);
          console.error('Photo source:', photoPreview.substring(0, 100) + '...');
        };
      } else {
        console.log('No photo uploaded yet, showing frame only...');
        // Just show frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(frameImg, 0, 0);
        
        // Still draw text even without photo
        console.log('Drawing text (frame only mode):', { name, designation, location });
        drawText(ctx, campaign.textPositions);
        
        setCanvasReady(true);
        console.log('Frame displayed, waiting for photo upload...');
      }
    };
    
    frameImg.onerror = (err) => {
      console.error('❌ Failed to load frame image from:', frameUrl);
      console.error('Error event:', err);
      console.log('Trying to test image loading...');
      
      // Try to create another image to test
      const testImg = new Image();
      testImg.onload = () => console.log('Test image loaded OK');
      testImg.onerror = () => console.error('Test image also failed');
      testImg.src = frameUrl + '?t=' + Date.now();
    };
    
    // Force load in case of caching issues
    frameImg.src = frameUrl + '?t=' + Date.now();
  }, [campaign, photoPreview, photoScale, photoPosition, name, designation, location]);

  const drawText = (ctx: CanvasRenderingContext2D, positions: TextPosition[]) => {
    console.log('drawText called with positions:', positions.length);
    
    positions.forEach((pos) => {
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
        
        ctx.fillText(text, pos.x, pos.y);
        
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
    if (!photoPreview || !canvasRef.current) return;
    
    // Prevent default to stop scrolling on mobile
    if ('touches' in e) {
      e.preventDefault();
    }
    
    setIsDragging(true);
    
    let clientX, clientY;
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    
    // Prevent scrolling on mobile while dragging
    if ('touches' in e) {
      e.preventDefault();
    }
    
    let clientX, clientY;
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
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
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      console.log('Generating final poster...');
      
      // Load frame image
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const frameUrl = `${baseUrl}${campaign.frameImageUrl}`;
      
      const frameImg = new Image();
      frameImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        frameImg.onload = resolve;
        frameImg.onerror = reject;
        frameImg.src = frameUrl;
      });

      // Set canvas to frame dimensions
      canvas.width = frameImg.width;
      canvas.height = frameImg.height;

      // Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw cropped photo (or original if no crop)
      const photoToUse = croppedPhoto || photoPreview;
      if (photoToUse) {
        const photoImg = new Image();
        photoImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          photoImg.onload = resolve;
          photoImg.onerror = reject;
          photoImg.src = photoToUse;
        });

        const cropShape = (campaign as any).cropShape;
        
        if (cropShape) {
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
          // Rectangle doesn't need clipping
        }

        // Draw the photo
        if (cropShape) {
          // Use crop shape position and size
          ctx.drawImage(photoImg, cropShape.x, cropShape.y, cropShape.width, cropShape.height);
        } else {
          // Scale to fit frame
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

      // Draw text
      drawText(ctx, campaign.textPositions);

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
      const formData = new FormData();
      formData.append('campaignId', campaign._id);
      formData.append('supporterName', name);
      formData.append('designation', designation);
      formData.append('location', location);
      formData.append('photo', photo!);
      
      // Don't send generatedImageUrl as file - backend will use the uploaded photo
      // The backend will save the uploaded photo path as both uploadedPhotoUrl and generatedImageUrl
      
      await posterAPI.create(formData);
      
      // Download the image - with mobile fallback
      const fileName = `campaign-poster-${name}.png`;
      
      // Check if it's iOS Safari (which doesn't support download attribute)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOS || isSafari) {
        // For iOS Safari: open image in new tab for long-press save
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
          // Popup blocked - fallback to showing alert
          alert('Please allow popups to download, or long-press the preview image to save it.');
        } else {
          alert('Your poster is ready! Long-press the image and select "Save Image" to download it.');
        }
        
        // Clean up after delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        // Standard download for desktop and Android
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Error:', err);
      alert('Failed to save poster. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!campaign) return;
    
    const message = encodeURIComponent(
      `Check out my campaign poster for "${campaign.title}"! Create yours now!`
    );
    const url = `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Campaign not found'}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{campaign.title}</h1>
          {campaign.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{campaign.description}</p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {['Upload', 'Crop', 'Details', 'Download'].map((stepName, idx) => {
              const stepNames = ['upload', 'crop', 'details', 'done'];
              const currentIdx = stepNames.indexOf(step);
              const isActive = idx <= currentIdx;
              return (
                <React.Fragment key={stepName}>
                  {idx > 0 && <div className={`w-12 h-1 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />}
                  <div className={`flex items-center gap-2 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium hidden sm:inline">{stepName}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Upload Your Photo</h2>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-16 h-16 mb-4 text-gray-400" />
                <p className="mb-2 text-lg text-gray-700">
                  <span className="font-semibold">Click to upload your photo</span>
                </p>
                <p className="text-sm text-gray-500">PNG, JPG (Max 5MB)</p>
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
        )}

        {/* Step 2: Crop */}
        {step === 'crop' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-center">Adjust Your Photo</h2>
            <p className="text-center text-gray-600 mb-6">
              Drag and scale your photo to fit inside the shape
            </p>
            
            {/* Crop Canvas */}
            <div className="mb-6 flex justify-center">
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
                className="border-2 border-blue-500 rounded-lg cursor-move"
                style={{ 
                  maxWidth: '100%',
                  touchAction: 'none',
                  WebkitTouchCallout: 'none',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              />
            </div>

            {/* Scale Control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scale: {Math.round(photoScale * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={photoScale}
                onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm & Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 'details' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center">Enter Your Information</h2>
            
            {/* Cropped Photo Preview */}
            {croppedPhoto && (
              <div className="mb-6 flex justify-center">
                <img 
                  src={croppedPhoto} 
                  alt="Cropped" 
                  className="max-h-48 rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Volunteer, Supporter"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., New York, USA"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep('crop')}
                className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleDownload}
                disabled={!name || generating}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {generating ? 'Generating...' : 'Download Poster →'}
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for final poster generation */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

