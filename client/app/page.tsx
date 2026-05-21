'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { campaignAPI } from '@/lib/api';
import { Campaign } from '@/types';
import { Image as ImageIcon, ArrowRight, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { encodeShortId } from '@/lib/urlShortener';
import CampaignFramePreview from '@/components/CampaignFramePreview';

export default function Home() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  // Sample templates matching user's design requirements if none are loaded
  const sampleTemplates = [
    {
      _id: 'sample-1',
      title: 'Community Relief Fund',
      description: 'Support local families affected by recent emergency events. Join our donor movement.',
      frameImageUrl: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
      textPositions: [
        { field: 'name', label: 'Supporter Name', x: 80, y: 700, fontSize: 44, color: '#FFFFFF', isBold: true, enabled: true },
        { field: 'designation', label: 'Contribution', x: 80, y: 760, fontSize: 32, color: '#34D399', isBold: false, enabled: true }
      ],
      posterCount: 1420
    },
    {
      _id: 'sample-2',
      title: 'City Council Vote',
      description: 'Mobilize voters for clean governance and inclusive local leadership. Your vote, your voice.',
      frameImageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80',
      textPositions: [
        { field: 'name', label: 'Voter Name', x: 100, y: 800, fontSize: 48, color: '#1E3A8A', isBold: true, enabled: true },
        { field: 'designation', label: 'Ward Details', x: 100, y: 860, fontSize: 30, color: '#D97706', isBold: true, enabled: true }
      ],
      posterCount: 3845
    },
    {
      _id: 'sample-3',
      title: 'Clean Water Act',
      description: 'Demand ecological action and clean water protection rules for all communities.',
      frameImageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      textPositions: [
        { field: 'name', label: 'Activist Name', x: 75, y: 720, fontSize: 42, color: '#0F766E', isBold: true, enabled: true },
        { field: 'location', label: 'City Location', x: 75, y: 780, fontSize: 34, color: '#0284C7', isBold: false, enabled: true }
      ],
      posterCount: 928
    }
  ];

  // Combine real database campaigns with sample templates to ensure a rich dashboard experience
  const allCampaignsToDisplay = campaigns.length > 0 
    ? campaigns 
    : sampleTemplates as unknown as Campaign[];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* Dynamic Keyframes Animation Injection */}
      <style jsx global>{`
        @keyframes wave-snaker {
          0% { transform: translateX(0) translateY(0) scale(1); }
          50% { transform: translateX(-10%) translateY(2%) scale(1.05); }
          100% { transform: translateX(0) translateY(0) scale(1); }
        }
        .animate-wave-trail {
          animation: wave-snaker 20s ease-in-out infinite;
        }
        /* Hide scrollbars but keep functionality */
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Fixed minimalist navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A2540]/90 backdrop-blur-md border-b border-blue-900/20">
        <div className="container mx-auto px-4 max-w-7xl h-20 flex items-center justify-between">
          
          {/* Logo on the left */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 10c3-3 3-5 5-5s3 2 5 5 3 5 5 5 3-2 5-5" />
                <path d="M2 17c3-3 3-5 5-5s3 2 5 5 3 5 5 5 3-2 5-5" />
              </svg>
            </div>
            <span className="text-white font-extrabold text-2xl tracking-tight">
              Dpro <span className="text-emerald-400">Campaigns</span>
            </span>
          </Link>

          {/* Clean text links on the right */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#campaigns" className="text-sm font-semibold text-gray-300 hover:text-emerald-400 transition-colors">Home</Link>
            <a href="#features" className="text-sm font-semibold text-gray-300 hover:text-emerald-400 transition-colors">Features</a>
          </nav>

          {/* Simple Mobile Menu Trigger */}
          <button className="md:hidden text-white focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-[#0A2540] text-white overflow-hidden">
        
        {/* Glow Abstract Sine Wave Backgrounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <svg className="absolute w-[200%] h-full top-0 left-0 animate-wave-trail" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,150 C150,50 350,250 500,150 C650,50 850,250 1000,150 C1150,50 1350,250 1500,150 L1500,400 L0,400 Z" fill="url(#wave-gradient-1)" opacity="0.1" />
            <path d="M0,220 C200,120 300,320 550,220 C800,120 900,320 1150,220 C1400,120 1500,320 1750,220" stroke="url(#line-gradient-1)" strokeWidth="3" opacity="0.4" strokeDasharray="12, 6" />
            <path d="M50,180 C250,280 400,80 650,180 C900,280 1050,80 1300,180" stroke="url(#line-gradient-2)" strokeWidth="1.5" opacity="0.25" />
            <defs>
              <linearGradient id="wave-gradient-1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00C853" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#00C853" />
              </linearGradient>
              <linearGradient id="line-gradient-1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
                <stop offset="50%" stopColor="#00C853" stopOpacity="1" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="line-gradient-2" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00C853" stopOpacity="0" />
                <stop offset="50%" stopColor="#60A5FA" stopOpacity="1" />
                <stop offset="100%" stopColor="#00C853" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Ambient background glows */}
        <div className="absolute top-1/4 right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-[-10%] w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Bold Typography Content */}
            <div className="lg:col-span-7 flex flex-col text-left">
              <span className="inline-flex items-center gap-2 text-emerald-400 font-bold tracking-wider text-xs uppercase mb-4 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start">
                ✨ Empowering Grassroots Mobilization
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
                Launch Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Movement</span> With Dpro Campaigns
              </h1>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 font-normal leading-relaxed max-w-xl">
                Engage, Mobilize, and Win: All-in-One Tools for Grassroots Campaigns. Create instantly shareable campaign materials that amplify your community presence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <Link
                  href="#campaigns"
                  className="inline-flex items-center justify-center gap-2 bg-[#00C853] hover:bg-[#00B24A] text-white text-base font-extrabold px-8 py-4 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
                >
                  Start Your Movement Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/admin/create-campaign"
                  className="inline-flex items-center justify-center gap-2 bg-blue-950/40 hover:bg-blue-900/40 text-gray-200 hover:text-white border border-blue-800/60 hover:border-blue-700/80 text-base font-bold px-7 py-4 rounded-full transition-all active:scale-95"
                >
                  <PlusCircle className="w-5 h-5 text-emerald-400" />
                  Create Campaign Poster
                </Link>
              </div>
            </div>

            {/* Right Column: Megaphone Vector Illustration */}
            <div className="lg:col-span-5 flex justify-center relative">
              <div className="relative w-full max-w-[440px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-blue-900/30 bg-[#0A2540]/60 p-4 backdrop-blur-sm">
                <img
                  src="/hero_megaphone_illustration.png"
                  alt="Campaign Megaphone Activation Vortex"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Organic Curve Divider */}
      <div className="relative w-full overflow-hidden leading-[0] fill-white bg-[#0A2540] pointer-events-none">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[80px]">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C26.9,8.75,55.05,16.3,83.36,22.21,141.3,34.33,201.29,42.41,262,49.25A1108.68,1108.68,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>

      {/* Carousel Section (Bottom White Area) */}
      <section id="campaigns" className="bg-white py-16 md:py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* Header & Horizontal Arrows */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
            <div className="text-left">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
                Featured Campaign Templates
              </h2>
              <p className="text-gray-500 mt-2 text-base md:text-lg">
                Select an active movement card to design your customized mobilization poster.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={scrollLeft}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm flex items-center justify-center text-gray-700 transition-all hover:scale-105 active:scale-95"
                aria-label="Scroll Left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollRight}
                className="w-12 h-12 rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 shadow-sm flex items-center justify-center text-gray-700 transition-all hover:scale-105 active:scale-95"
                aria-label="Scroll Right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cards Carousel */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-blue-50 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-t-4 border-[#00C853] animate-spin"></div>
              </div>
              <p className="text-gray-500 font-medium animate-pulse">Loading campaign templates...</p>
            </div>
          ) : (
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scrollbar-none pb-6 snap-x snap-mandatory touch-pan-x"
            >
              {allCampaignsToDisplay.map((campaign) => {
                const isSample = campaign._id.startsWith('sample');
                // Use a hex string path if sample or route directly to campaigns page otherwise
                const shortId = isSample ? 'sample' : encodeShortId(campaign._id);
                const targetUrl = isSample ? `/campaigns/${campaign._id}` : `/c/${shortId}`;

                return (
                  <div
                    key={campaign._id}
                    className="flex-none w-[320px] sm:w-[360px] bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 snap-start flex flex-col justify-between group cursor-pointer text-left"
                    onClick={() => {
                      if (isSample) {
                        // For sample cards, redirect to the campaigns route if we don't have MongoDB campaigns
                        router.push(`/admin/create-campaign`);
                      } else {
                        router.push(targetUrl);
                      }
                    }}
                  >
                    <div>
                      {/* Dynamic Canvas Frame Preview with text position markers */}
                      <div className="w-full relative overflow-hidden bg-gray-50 aspect-square">
                        <CampaignFramePreview campaign={campaign} />
                        
                        {/* Interactive overlay tag */}
                        <div className="absolute top-4 left-4 bg-[#0A2540]/80 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          {isSample ? 'TEMPLATE' : 'ACTIVE'}
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                          {campaign.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                          {campaign.description || 'Engage your community and create personalized posters for this campaign.'}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-150 pt-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-gray-800 text-base">{campaign.posterCount || 0}</span>
                          <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">posters created</span>
                        </div>
                        
                        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#0A2540] group-hover:bg-[#00C853] text-white shadow-sm transition-colors duration-300">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A2540] text-gray-400 py-12 mt-auto border-t border-blue-900/30">
        <div className="container mx-auto px-4 max-w-7xl text-center flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 10c3-3 3-5 5-5s3 2 5 5 3 5 5 5 3-2 5-5" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Dpro <span className="text-emerald-400">Campaigns</span>
            </span>
          </div>
          
          <p className="text-sm">
            © 2026 Dpro Campaigns SaaS. Built for active mobilization. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
