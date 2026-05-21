import { Metadata } from 'next';
import CampaignClient from './CampaignClient';
import { Campaign } from '@/types';

// Server-side fetching with error handling and fallback
async function getCampaign(id: string): Promise<Campaign | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    console.log(`[Server] Fetching campaign metadata for dynamic OG: ${apiUrl}/campaigns/${id}`);
    
    const res = await fetch(`${apiUrl}/campaigns/${id}`, {
      next: { revalidate: 30 } // Cache campaign details for up to 30 seconds
    });
    
    if (!res.ok) {
      console.error(`[Server] API returned non-ok status: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    return data.campaign;
  } catch (error) {
    console.error('[Server] Failed to fetch campaign details from backend API:', error);
    return null;
  }
}

type Props = {
  params: Promise<{ id: string }>;
};

// Generate dynamic OpenGraph metadata for rich previews in WhatsApp, Telegram, Slack, and Facebook
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const campaign = await getCampaign(resolvedParams.id);
  
  if (!campaign) {
    return {
      title: 'Campaign Poster | Join & Support',
      description: 'Create your campaign poster now!',
    };
  }

  // Resolve absolute frame image URL for standard OpenGraph requirements
  const frameUrl = campaign.frameImageUrl.startsWith('http')
    ? campaign.frameImageUrl
    : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '')}${campaign.frameImageUrl}`;

  console.log(`[Server] Generated dynamic OpenGraph frame preview url: ${frameUrl}`);

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
  const campaign = await getCampaign(resolvedParams.id);

  // Render the client component, passing down the pre-fetched campaign payload
  return <CampaignClient initialCampaign={campaign} />;
}
