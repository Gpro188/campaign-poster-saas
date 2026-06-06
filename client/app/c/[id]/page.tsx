import { Metadata } from 'next';
import CampaignClient from '../../campaigns/[id]/CampaignClient';
import { Campaign } from '@/types';
import { decodeShortId } from '@/lib/urlShortener';

// Server-side fetching of campaign by decoded hex ID
async function getCampaign(hexId: string): Promise<Campaign | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    console.log(`[Server Short-URL] Fetching campaign: ${apiUrl}/campaigns/${hexId}`);
    
    const res = await fetch(`${apiUrl}/campaigns/${hexId}`, {
      next: { revalidate: 30 } // Cache campaign details for up to 30 seconds
    });
    
    if (!res.ok) {
      console.error(`[Server Short-URL] API returned non-ok status: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    return data.campaign;
  } catch (error) {
    console.error('[Server Short-URL] Failed to fetch campaign details from backend API:', error);
    return null;
  }
}

type Props = {
  params: Promise<{ id: string }>;
};

// Generate dynamic OpenGraph metadata for WhatsApp link previews on the shortened URL
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const hexId = decodeShortId(resolvedParams.id);
  const campaign = await getCampaign(hexId);
  
  if (!campaign) {
    return {
      title: 'Campaign Poster | Join & Support',
      description: 'Create your campaign poster now!',
    };
  }

  let frameUrl = campaign.frameImageUrl.startsWith('http')
    ? campaign.frameImageUrl
    : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '')}${campaign.frameImageUrl}`;

  // Optimize image for WhatsApp (must be < 300kb, JPEG is safest)
  if (frameUrl.includes('cloudinary.com') && frameUrl.includes('/upload/')) {
    frameUrl = frameUrl.replace('/upload/', '/upload/w_1200,h_630,c_pad,b_white,q_auto:eco,f_jpg/');
  }

  return {
    title: `${campaign.title} | Campaign Poster Generator`,
    description: campaign.description || 'Support this campaign by generating a custom poster with your photo!',
    openGraph: {
      title: campaign.title,
      description: campaign.description || 'Create your custom campaign poster instantly!',
      images: [
        {
          url: frameUrl,
          width: 1200,
          height: 630,
          alt: campaign.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.title,
      description: campaign.description || 'Create your custom campaign poster instantly!',
      images: [frameUrl],
    },
  };
}

export default async function CampaignPage({ params }: Props) {
  const resolvedParams = await params;
  const hexId = decodeShortId(resolvedParams.id);
  const campaign = await getCampaign(hexId);

  // Render the pre-existing client editor component with the preloaded campaign details
  return <CampaignClient initialCampaign={campaign} />;
}
