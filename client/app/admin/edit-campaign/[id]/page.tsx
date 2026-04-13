'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { campaignAPI } from '@/lib/api';
import { TextPosition, Campaign } from '@/types';
import { Upload, Save, X, Type, Move, Trash2 } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
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
            fontSize: pos.fontSize || 48,
            color: pos.color || '#FFFFFF',
            isBold: pos.isBold !== undefined ? pos.isBold : pos.field === 'name',
            enabled: pos.enabled !== false, // Load enabled status from database
          }));
          setTextPositions(loadedPositions);
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

  useEffect(() => {
    if (framePreview && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.src = framePreview;
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const enabledPositions = textPositions.filter(pos => pos.enabled !== false);
        enabledPositions.forEach((pos) => {
          const fontSize = pos.fontSize || 48;
          const color = pos.color || '#FFFFFF';
          ctx.font = `${pos.isBold ? 'bold' : ''} ${fontSize}px Arial`;
          ctx.fillStyle = color;
          ctx.fillText(pos.label, pos.x, pos.y);
          
          const metrics = ctx.measureText(pos.label);
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(pos.x - 5, pos.y - fontSize, metrics.width + 10, fontSize + 10);
        });
      };
      
      img.onerror = () => {
        console.error('Failed to load frame image');
      };
    } else if (existingFrameUrl && !framePreview && canvasRef.current) {
      // Load existing frame
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      // Check if URL is already absolute (Cloudinary) or relative
      img.src = existingFrameUrl.startsWith('http') 
        ? existingFrameUrl 
        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${existingFrameUrl}`;
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const enabledPositions = textPositions.filter(pos => pos.enabled !== false);
        enabledPositions.forEach((pos) => {
          const fontSize = pos.fontSize || 48;
          const color = pos.color || '#FFFFFF';
          ctx.font = `${pos.isBold ? 'bold' : ''} ${fontSize}px Arial`;
          ctx.fillStyle = color;
          ctx.fillText(pos.label, pos.x, pos.y);
          
          const metrics = ctx.measureText(pos.label);
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(pos.x - 5, pos.y - fontSize, metrics.width + 10, fontSize + 10);
        });
      };
    }
  }, [framePreview, existingFrameUrl, textPositions]);

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

    const enabledPositions = textPositions.filter(pos => pos.enabled !== false);
    const clickedField = enabledPositions.find((pos) => {
      const fontSize = pos.fontSize || 48;
      const metrics = ctx.measureText(pos.label);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      
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

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${params.id}`, {
        method: 'PUT',
        body: formData,
      });

      alert('Campaign updated successfully!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update campaign');
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
