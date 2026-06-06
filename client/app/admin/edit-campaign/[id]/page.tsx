'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { campaignAPI } from '@/lib/api';
import { TextPosition, Campaign, CropShape } from '@/types';
import { Upload, Save, X, Type, Move, Trash2, Circle, Square, Triangle } from 'lucide-react';

interface DraggableText {
  field: 'name' | 'designation' | 'location';
  label: string;
  x: number;
  y: number;
  width?: number; // Text box width for wrapping
  fontSize?: number;
  color?: string;
  isBold?: boolean;
  enabled?: boolean;
  textAlign?: 'left' | 'center' | 'right';
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frameImage, setFrameImage] = useState<File | null>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [existingFrameUrl, setExistingFrameUrl] = useState('');
  const [textPositions, setTextPositions] = useState<DraggableText[]>([
    { field: 'name', label: 'Name', x: 100, y: 100, fontSize: 48, color: '#FFFFFF', isBold: true, enabled: true },
    { field: 'designation', label: 'Designation', x: 100, y: 160, fontSize: 32, color: '#FFFFFF', isBold: false, enabled: true },
    { field: 'location', label: 'Location', x: 100, y: 210, fontSize: 28, color: '#FFFFFF', isBold: false, enabled: true },
  ]);
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [shapeDragOffset, setShapeDragOffset] = useState({ x: 0, y: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Resize state
  const [resizingField, setResizingField] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, width: 0, startMouseX: 0 });
  
  // Crop shape state
  const [cropShape, setCropShape] = useState<CropShape | null>(null);
  const [selectedShapeType, setSelectedShapeType] = useState<'none' | 'circle' | 'rectangle' | 'triangle'>('none');
  const [draggingShape, setDraggingShape] = useState(false);
  const [resizingShape, setResizingShape] = useState(false);
  const [shapeResizeStart, setShapeResizeStart] = useState({ width: 0, height: 0, startMouseX: 0, startMouseY: 0 });
  
  // Subscription duration
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const data = await campaignAPI.getById(params.id as string);
        setCampaign(data);
        
        // Populate form fields
        setTitle(data.title);
        setDescription(data.description || '');
        setExistingFrameUrl(data.frameImageUrl);
        setStatus(data.status);
        
        // Set dates
        if ((data as any).startDate) {
          const start = new Date((data as any).startDate).toISOString().split('T')[0];
          setStartDate(start);
        }
        if ((data as any).endDate) {
          const end = new Date((data as any).endDate).toISOString().split('T')[0];
          setEndDate(end);
        }
        
        // Load text positions
        if (data.textPositions && data.textPositions.length > 0) {
          const loadedPositions: DraggableText[] = data.textPositions.map((pos: TextPosition) => ({
            field: pos.field,
            label: pos.label || pos.field.charAt(0).toUpperCase() + pos.field.slice(1), // Use saved label or default
            x: pos.x,
            y: pos.y,
            width: pos.width, // Load width
            fontSize: pos.fontSize || 48,
            color: pos.color || '#FFFFFF',
            isBold: pos.isBold !== undefined ? pos.isBold : pos.field === 'name',
            enabled: pos.enabled !== false, // Load enabled status from database
            textAlign: pos.textAlign || 'left', // Load text alignment
          }));
          setTextPositions(loadedPositions);
        }
        
        // Load crop shape
        if (data.cropShape) {
          setCropShape(data.cropShape);
          setSelectedShapeType(data.cropShape.type || 'none');
        } else {
          setCropShape(null);
          setSelectedShapeType('none');
        }
      } catch (err: any) {
        console.error('Failed to load campaign:', err);
        setError('Failed to load campaign details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadCampaign();
    }
  }, [params.id]);

  // Shape management functions
  const handleShapeTypeChange = (shapeType: 'none' | 'circle' | 'rectangle' | 'triangle') => {
    setSelectedShapeType(shapeType);
    if (shapeType === 'none') {
      setCropShape(null);
    } else if ((framePreview || existingFrameUrl) && canvasRef.current) {
      // Create default shape in center of canvas
      const canvas = canvasRef.current;
      const defaultWidth = (canvas.width || 800) * 0.3;
      const defaultHeight = (canvas.height || 800) * 0.3;
      setCropShape({
        type: shapeType,
        x: ((canvas.width || 800) - defaultWidth) / 2,
        y: ((canvas.height || 800) - defaultHeight) / 2,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0
      });
    }
  };

  const handleShapeMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropShape || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking inside shape
    if (
      x >= cropShape.x &&
      x <= cropShape.x + cropShape.width &&
      y >= cropShape.y &&
      y <= cropShape.y + cropShape.height
    ) {
      // Check if clicking near bottom-right corner for resize
      const isNearCorner = 
        Math.abs(x - (cropShape.x + cropShape.width)) < 20 &&
        Math.abs(y - (cropShape.y + cropShape.height)) < 20;
      
      if (isNearCorner) {
        setResizingShape(true);
        setShapeResizeStart({ width: cropShape.width, height: cropShape.height, startMouseX: x, startMouseY: y });
      } else {
        setDraggingShape(true);
        setShapeDragOffset({ x: x - cropShape.x, y: y - cropShape.y });
      }
      e.preventDefault();
    }
  };

  const handleShapeMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if ((!draggingShape && !resizingShape) || !cropShape || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (draggingShape) {
      setCropShape(prev => prev ? {
        ...prev,
        x: x - shapeDragOffset.x,
        y: y - shapeDragOffset.y
      } : null);
    } else if (resizingShape) {
      setCropShape(prev => prev ? {
        ...prev,
        width: Math.max(50, shapeResizeStart.width + (x - shapeResizeStart.startMouseX)),
        height: Math.max(50, shapeResizeStart.height + (y - shapeResizeStart.startMouseY))
      } : null);
    }
  };

  const handleShapeMouseUp = () => {
    setDraggingShape(false);
    setResizingShape(false);
  };

  const drawCropShape = (ctx: CanvasRenderingContext2D, shape: CropShape) => {
    ctx.save();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    
    if (shape.type === 'circle') {
      const centerX = shape.x + shape.width / 2;
      const centerY = shape.y + shape.height / 2;
      const radius = Math.min(shape.width, shape.height) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Fill with semi-transparent color
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fill();
    } else if (shape.type === 'rectangle') {
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === 'triangle') {
      const centerX = shape.x + shape.width / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, shape.y);
      ctx.lineTo(shape.x, shape.y + shape.height);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fill();
    }
    
    // Draw resize handle
    ctx.setLineDash([]);
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(shape.x + shape.width, shape.y + shape.height, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  useEffect(() => {
    if ((framePreview || existingFrameUrl) && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      if (framePreview) {
        img.src = framePreview;
      } else {
        img.crossOrigin = 'anonymous';
        // Check if URL is already absolute (Cloudinary) or relative
        img.src = existingFrameUrl.startsWith('http') 
          ? existingFrameUrl 
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${existingFrameUrl}`;
      }
      
      // Helper function to draw wrapped text matching the main canvas logic
      const drawWrappedText = (
        context: CanvasRenderingContext2D,
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
          const metrics = context.measureText(testLine);
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

        context.textAlign = align;
        context.textBaseline = 'top';

        lines.forEach((lineText, index) => {
          let drawX = x;
          if (align === 'center') {
            drawX = x + maxWidth / 2;
          } else if (align === 'right') {
            drawX = x + maxWidth;
          }
          context.fillText(lineText, drawX, currentY + index * lineHeight);
        });

        // Reset alignment
        context.textAlign = 'left';
        context.textBaseline = 'alphabetic';
      };

      img.onload = () => {
        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw white background first
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw frame image
        ctx.drawImage(img, 0, 0);

        // Draw text positions (only enabled ones)
        const enabledPositions = textPositions.filter(pos => pos.enabled !== false);
        enabledPositions.forEach((pos) => {
          const fontSize = pos.fontSize || 48;
          const color = pos.color || '#FFFFFF';
          const fontFamily = pos.fontFamily || 'Arial';
          ctx.font = `${pos.isBold ? 'bold' : ''} ${fontSize}px "${fontFamily}"`;
          ctx.fillStyle = color;
          
          // Calculate text box dimensions
          const boxWidth = pos.width || (canvas.width - pos.x - 40);
          const boxHeight = fontSize * 2.5; // Approximate for 2 lines
          const textAlign = pos.textAlign || 'left';

          // Draw wrapped text matching public view
          drawWrappedText(ctx, pos.label, pos.x, pos.y, boxWidth, fontSize, textAlign);
          
          // Draw text box background
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
          ctx.fillRect(pos.x, pos.y, boxWidth, boxHeight);
          
          // Draw text box border
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(pos.x, pos.y, boxWidth, boxHeight);
          ctx.setLineDash([]);
          
          // Draw resize handles (small squares on left and right)
          const handleSize = 12;
          ctx.fillStyle = '#3B82F6';
          
          // Left handle
          ctx.fillRect(pos.x - handleSize/2, pos.y + (boxHeight/2) - handleSize/2, handleSize, handleSize);
          
          // Right handle
          ctx.fillRect(pos.x + boxWidth - handleSize/2, pos.y + (boxHeight/2) - handleSize/2, handleSize, handleSize);
          
          // Draw width label
          ctx.fillStyle = '#3B82F6';
          ctx.font = '12px Arial';
          ctx.fillText(`${Math.round(boxWidth)}px`, pos.x + boxWidth/2 - 20, pos.y - 5);
        });
        
        // Draw crop shape if exists
        if (cropShape) {
          drawCropShape(ctx, cropShape);
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load frame image');
      };
    }
  }, [framePreview, existingFrameUrl, textPositions, cropShape]);

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrameImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFramePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicked on resize handles first
    const enabledPositions = textPositions.filter(pos => pos.enabled !== false);
    for (const pos of enabledPositions) {
      const fontSize = pos.fontSize || 48;
      const boxWidth = pos.width || (canvas.width - pos.x - 40);
      const boxHeight = fontSize * 2.5;
      const handleSize = 12;
      const centerY = pos.y + (boxHeight / 2);
      
      // Check left handle
      if (
        x >= pos.x - handleSize &&
        x <= pos.x + handleSize &&
        y >= centerY - handleSize &&
        y <= centerY + handleSize
      ) {
        setResizingField(pos.field);
        setResizeHandle('left');
        setResizeStart({ x: pos.x, width: boxWidth, startMouseX: x });
        e.preventDefault();
        return;
      }
      
      // Check right handle
      if (
        x >= pos.x + boxWidth - handleSize &&
        x <= pos.x + boxWidth + handleSize &&
        y >= centerY - handleSize &&
        y <= centerY + handleSize
      ) {
        setResizingField(pos.field);
        setResizeHandle('right');
        setResizeStart({ x: pos.x, width: boxWidth, startMouseX: x });
        e.preventDefault();
        return;
      }
    }

    // Check if clicked near any enabled text position (for dragging)
    const clickedField = enabledPositions.find((pos) => {
      const fontSize = pos.fontSize || 48;
      const boxWidth = pos.width || (canvas.width - pos.x - 40);
      const boxHeight = fontSize * 2.5;
      
      // Check if click is within text box (using top baseline)
      return (
        x >= pos.x &&
        x <= pos.x + boxWidth &&
        y >= pos.y &&
        y <= pos.y + boxHeight
      );
    });

    if (clickedField) {
      setDraggingField(clickedField.field);
      setDragOffset({ x: x - clickedField.x, y: y - clickedField.y });
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Handle resizing
    if (resizingField && resizeHandle) {
      const dx = x - resizeStart.startMouseX;
      
      setTextPositions((prev) =>
        prev.map((pos) => {
          if (pos.field !== resizingField) return pos;
          
          const currentWidth = pos.width || (canvas.width - pos.x - 40);
          
          if (resizeHandle === 'left') {
            // Moving left edge: adjust x and width
            const newX = Math.max(0, resizeStart.x + dx);
            const newWidth = resizeStart.width - (newX - resizeStart.x);
            return { ...pos, x: newX, width: Math.max(50, newWidth) };
          } else {
            // Moving right edge: just adjust width
            const newWidth = Math.max(50, resizeStart.width + dx);
            return { ...pos, width: newWidth };
          }
        })
      );
      return;
    }

    // Handle dragging
    if (!draggingField) return;

    setTextPositions((prev) =>
      prev.map((pos) =>
        pos.field === draggingField ? { ...pos, x: x - dragOffset.x, y: y - dragOffset.y } : pos
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingField(null);
    setResizingField(null);
    setResizeHandle(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('Please enter a campaign title');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      if (frameImage) {
        formData.append('frame', frameImage);
      }
      formData.append('title', title);
      formData.append('description', description);
      formData.append('status', status);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append(
        'textPositions',
        JSON.stringify(
          textPositions
            .filter(pos => pos.enabled !== false)
            .map(({ field, x, y, width, fontSize, fontFamily, color, isBold, textAlign }) => ({
              field,
              x,
              y,
              width,
              fontSize,
              fontFamily,
              color,
              isBold,
              textAlign,
            }))
        )
      );
      if (cropShape) {
        formData.append('cropShape', JSON.stringify(cropShape));
      } else {
        formData.append('cropShape', 'null');
      }

      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin_token='))
        ?.split('=')[1];

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${params.id}`, {
        method: 'PUT',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update campaign');
      }

      alert('Campaign updated successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to update campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Edit Campaign</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Campaign Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter campaign title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Campaign Duration:</strong> The campaign will be visible to the public only between the start and end dates.
                </p>
              </div>
            </div>
          </div>

          {/* Frame Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Frame Image</h2>
            {existingFrameUrl && !framePreview && (
              <p className="text-sm text-gray-600 mb-2">
                Current frame: <span className="font-medium">{existingFrameUrl.split('/').pop()}</span>
              </p>
            )}
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {framePreview ? (
                    <img src={framePreview} alt="Frame preview" className="max-h-56 object-contain" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload new frame</span> or leave empty to keep current
                      </p>
                      <p className="text-xs text-gray-500">PNG with transparent area (recommended)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrameUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Photo Crop Shape - NEW FEATURE v2.0 */}
          {(framePreview || existingFrameUrl) && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-green-500">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">🎨 Photo Crop Shape</h2>
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">NEW</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select a shape to guide where users place their photos. This makes it easier for them to position correctly!
              </p>
              
              {/* Shape Type Selector */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => handleShapeTypeChange('none')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    selectedShapeType === 'none'
                      ? 'border-gray-800 bg-gray-100'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <X className="w-6 h-6" />
                  <span className="text-xs font-medium">None</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShapeTypeChange('circle')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    selectedShapeType === 'circle'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <Circle className="w-6 h-6" />
                  <span className="text-xs font-medium">Circle</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShapeTypeChange('rectangle')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    selectedShapeType === 'rectangle'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <Square className="w-6 h-6" />
                  <span className="text-xs font-medium">Rectangle</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShapeTypeChange('triangle')}
                  className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                    selectedShapeType === 'triangle'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <Triangle className="w-6 h-6" />
                  <span className="text-xs font-medium">Triangle</span>
                </button>
              </div>
              
              {cropShape && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">💡 Instructions:</p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Drag the shape on canvas to reposition</li>
                    <li>• Drag the blue circle (bottom-right) to resize</li>
                    <li>• Users will see this shape when uploading photos</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Text Position Editor */}
          {(framePreview || existingFrameUrl) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Move className="w-5 h-5" />
                Position Text Elements
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Drag text on canvas to reposition)
                </span>
              </h2>
              
              <div className="overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  onMouseDown={(e) => {
                    if (cropShape) {
                      handleShapeMouseDown(e);
                    }
                    if (!draggingShape && !resizingShape) {
                      handleCanvasMouseDown(e);
                    }
                  }}
                  onMouseMove={(e) => {
                    if (cropShape && (draggingShape || resizingShape)) {
                      handleShapeMouseMove(e);
                    } else if (!draggingShape && !resizingShape) {
                      handleCanvasMouseMove(e);
                    }
                  }}
                  onMouseUp={() => {
                    handleShapeMouseUp();
                    handleCanvasMouseUp();
                  }}
                  onMouseLeave={() => {
                    handleShapeMouseUp();
                    handleCanvasMouseUp();
                  }}
                  className="border border-gray-300 rounded-lg cursor-move max-w-full bg-white"
                  style={{ minHeight: '400px', minWidth: '600px' }}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {textPositions.map((pos) => (
                  <div key={pos.field} className={`border rounded-lg p-3 ${pos.enabled === false ? 'border-gray-200 bg-gray-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{pos.label}</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pos.enabled !== false}
                          onChange={(e) => {
                            setTextPositions((prev) =>
                              prev.map((p) =>
                                p.field === pos.field ? { ...p, enabled: e.target.checked } : p
                              )
                            );
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-600">Show</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Field Label (what users see)</label>
                        <input
                          type="text"
                          value={pos.label}
                          onChange={(e) => {
                            setTextPositions((prev) =>
                              prev.map((p) =>
                                p.field === pos.field ? { ...p, label: e.target.value } : p
                              )
                            );
                          }}
                          className="w-full px-2 py-1 text-sm border rounded"
                          placeholder={pos.field === 'name' ? 'e.g., Student Name, Member Name' : pos.field === 'designation' ? 'e.g., Position, Role' : 'e.g., City, Branch'}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Position</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={Math.round(pos.x)}
                            onChange={(e) => {
                              setTextPositions((prev) =>
                                prev.map((p) =>
                                  p.field === pos.field ? { ...p, x: Number(e.target.value) } : p
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="X"
                          />
                          <input
                            type="number"
                            value={Math.round(pos.y)}
                            onChange={(e) => {
                              setTextPositions((prev) =>
                                prev.map((p) =>
                                  p.field === pos.field ? { ...p, y: Number(e.target.value) } : p
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="Y"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Size</label>
                          <input
                            type="number"
                            value={pos.fontSize}
                            onChange={(e) => {
                              setTextPositions((prev) =>
                                prev.map((p) =>
                                  p.field === pos.field ? { ...p, fontSize: Number(e.target.value) } : p
                                )
                              );
                            }}
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">Color</label>
                          <input
                            type="color"
                            value={pos.color}
                            onChange={(e) => {
                              setTextPositions((prev) =>
                                prev.map((p) =>
                                  p.field === pos.field ? { ...p, color: e.target.value } : p
                                )
                              );
                            }}
                            className="w-full h-7 border rounded cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Font Family</label>
                        <select
                          value={pos.fontFamily || 'Arial'}
                          onChange={(e) => {
                            setTextPositions((prev) =>
                              prev.map((p) =>
                                p.field === pos.field ? { ...p, fontFamily: e.target.value } : p
                              )
                            );
                          }}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Impact">Impact</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                          <option value="Trebuchet MS">Trebuchet MS</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Oswald">Oswald</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Anek Malayalam">Anek Malayalam</option>
                          <option value="Manjari">Manjari (Malayalam)</option>
                          <option value="Meera Inimai">Meera Inimai</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Text Alignment</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setTextPositions((prev) =>
                                prev.map((p) =>
                                  p.field === pos.field ? { ...p, textAlign: 'left' } : p
                                )
                              );
                            }}
                            className={`flex-1 px-2 py-1 text-xs border rounded ${
                              pos.textAlign === 'left' || !pos.textAlign
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            Left
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTextPositions((prev) =>
                                prev.map((p) =>
                                  p.field === pos.field ? { ...p, textAlign: 'center' } : p
                                )
                              );
                            }}
                            className={`flex-1 px-2 py-1 text-xs border rounded ${
                              pos.textAlign === 'center'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTextPositions((prev) =>
                                prev.map((p) =>
                                  p.field === pos.field ? { ...p, textAlign: 'right' } : p
                                )
                              );
                            }}
                            className={`flex-1 px-2 py-1 text-xs border rounded ${
                              pos.textAlign === 'right'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            Right
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Updating...' : 'Update Campaign'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 font-medium"
            >
              <X className="w-5 h-5" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
