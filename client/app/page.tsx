'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaignAPI } from '@/lib/api';
import { Campaign } from '@/types';
import { Image, ArrowRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin (you can customize this logic)
    // For example, check localStorage, a cookie, or a specific admin route
    const checkAdmin = () => {
      // Simple check: if user has visited /dashboard, consider them admin
      // In production, use proper authentication
      const visitedDashboard = localStorage.getItem('isAdmin') || 'false';
      setIsAdmin(visitedDashboard === 'true');
    };
    
    checkAdmin();
  }, []);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await campaignAPI.getAll();
        setCampaigns(data.filter((c) => c.status === 'active'));
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Create Your Campaign Poster
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Join the movement! Upload your photo and show your support.
          </p>
          <Link
            href="#campaigns"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Browse Campaigns
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div id="campaigns" className="bg-white min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Active Campaigns</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-24 h-24 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No active campaigns at the moment.</p>
              <p className="text-gray-400 mt-2">Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/campaigns/${campaign._id}`)}
                >
                  {/* Show actual frame image */}
                  <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center overflow-hidden relative">
                    {campaign.frameImageUrl ? (
                      <img
                        src={campaign.frameImageUrl.startsWith('http') 
                          ? campaign.frameImageUrl 
                          : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace('/api', '')}${campaign.frameImageUrl}`}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {campaign.title}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {campaign.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{campaign.posterCount} posters created</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2026 Campaign Poster SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
