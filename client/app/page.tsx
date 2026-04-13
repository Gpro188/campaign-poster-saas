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
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold text-gray-900">Active Campaigns</h2>
            <a
              href="https://wa.me/918592888137"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact Us
            </a>
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
