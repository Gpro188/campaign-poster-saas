export interface TextPosition {
  field: 'name' | 'designation' | 'location';
  label?: string; // Display label for the field (e.g., "Student Name", "Institution")
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  isBold?: boolean;
  enabled?: boolean; // Whether this field should be shown to users
}

export interface CropShape {
  type: 'circle' | 'rectangle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // for triangle
}

export interface Campaign {
  _id: string;
  title: string;
  description?: string;
  frameImageUrl: string;
  textPositions: TextPosition[];
  cropShape?: CropShape;
  status: 'active' | 'inactive';
  ownerId: string;
  posterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Poster {
  _id: string;
  campaignId: string | Campaign;
  supporterName: string;
  designation?: string;
  location?: string;
  uploadedPhotoUrl: string;
  generatedImageUrl: string;
  shareCount: number;
  createdAt: string;
}

export interface CampaignStats {
  campaign: Campaign;
  totalPosters: number;
  recentPosters: Poster[];
}
