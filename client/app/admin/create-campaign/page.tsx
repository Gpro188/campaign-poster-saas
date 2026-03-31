'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { campaignAPI } from '@/lib/api';
import { TextPosition } from '@/types';
import { Upload, Save, X, Type, Move } from 'lucide-react';

interface DraggableText {
  field: 'name' | 'designation' | 'location';
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  isBold?: boolean;
  enabled?: boolean;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frameImage, setFrameImage] = useState<File | null>(null);
  const [framePreview, setFramePreview] = useState<string | null>(null);
  const [textPositions, setTextPositions] = useState<DraggableText[]>([
    { field: 'name', label: 'Name', x: 100, y: 100, fontSize: 48, color: '#FFFFFF', isBold: true, enabled: true },
    { field: 'designation', label: 'Designation', x: 100, y: 160, fontSize: 32, color: '#FFFFFF', isBold: false, enabled: true },
    { field: 'location', label: 'Location', x: 100, y: 210, fontSize: 28, color: '#FFFFFF', isBold: false, enabled: true },
  ]);
  const [draggingField, setDraggingField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Subscription duration
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default 7 days
    return date.toISOString().split('T')[0];
  });

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

  useEffect(() => {
    if (framePreview && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = framePreview;
      
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
          ctx.font = `${pos.isBold ? 'bold' : ''} ${fontSize}px Arial`;
          ctx.fillStyle = color;
          ctx.fillText(pos.label, pos.x, pos.y);
          
          // Draw bounding box for visualization
          const metrics = ctx.measureText(pos.label);
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(pos.x - 5, pos.y - fontSize, metrics.width + 10, fontSize + 10);
        });
        
        console.log('Canvas rendered:', { 
          width: canvas.width, 
          height: canvas.height, 
          textCount: enabledPositions.length 
        });
      };
      
      img.onerror = () => {
        console.error('Failed to load frame image');
      };
    }
  }, [framePreview, textPositions]);

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

    // Check if clicked near any enabled text position
    const enabledPositions = textPositions.filter(pos => pos.enabled !== false);
    const clickedField = enabledPositions.find((pos) => {
      const fontSize = pos.fontSize || 48;
      const metrics = ctx.measureText(pos.label);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      
      // Check if click is within text bounding box
      return (
        x >= pos.x - 5 &&
        x <= pos.x + textWidth + 5 &&
        y >= pos.y - fontSize &&
        y <= pos.y + 10
      );
    });

    if (clickedField) {
      setDraggingField(clickedField.field);
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingField || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setTextPositions((prev) =>
      prev.map((pos) =>
        pos.field === draggingField ? { ...pos, x, y } : pos
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frameImage) {
      setError('Please upload a frame image');
      return;
    }
    if (!title) {
      setError('Please enter a campaign title');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('frame', frameImage);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('ownerId', 'admin');
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append(
        'textPositions',
        JSON.stringify(
          textPositions
            .filter(pos => pos.enabled !== false) // Only save enabled positions
            .map(({ field, x, y, fontSize, color, isBold }) => ({
              field,
              x,
              y,
              fontSize,
              color,
              isBold,
            }))
        )
      );

      await campaignAPI.create(formData);
      alert('Campaign created successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Create New Campaign</h1>

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
            <h2 className="text-xl font-semibold mb-4">Frame Upload</h2>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {framePreview ? (
                    <img src={framePreview} alt="Frame preview" className="max-h-56 object-contain" />
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
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
                  required
                />
              </label>
            </div>
          </div>

          {/* Text Position Editor */}
          {framePreview && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Move className="w-5 h-5" />
                Position Text Elements
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Drag text on canvas to reposition)
                </span>
              </h2>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Preview:</strong> Your frame image is loaded. Click and drag the red text boxes to position them.
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
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
              {isSubmitting ? 'Creating...' : 'Create Campaign'}
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
