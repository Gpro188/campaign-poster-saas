'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaignAPI, posterAPI } from '@/lib/api';
import { Campaign, Poster } from '@/types';
import { BarChart3, Users, Download, Trash2, Edit, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalPosters: 0,
  });

  useEffect(() => {
    // Set admin flag in localStorage
    localStorage.setItem('isAdmin', 'true');
    
    const loadDashboardData = async () => {
      try {
        const [campaignsData, postersData] = await Promise.all([
          // Use admin endpoint to get ALL campaigns (including expired)
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/admin/all`).then(res => res.json()),
          posterAPI.getAll(100),
        ]);

        const campaignsWithActiveStatus = campaignsData.campaigns.map((c: any) => ({
          ...c,
          isCurrentlyActive: c.isCurrentlyActive || false
        }));
        
        setCampaigns(campaignsWithActiveStatus);
        setPosters(postersData.posters);
        
        setStats({
          totalCampaigns: campaignsData.campaigns.length,
          activeCampaigns: campaignsData.campaigns.filter((c: any) => c.isCurrentlyActive).length,
          totalPosters: postersData.total,
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await campaignAPI.delete(id);
      setCampaigns((prev) => prev.filter((c) => c._id !== id));
      alert('Campaign deleted successfully!');
    } catch (error) {
      alert('Failed to delete campaign');
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    // Navigate to edit page with campaign data
    router.push(`/admin/edit-campaign/${campaign._id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            href="/admin/create-campaign"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Campaigns</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Campaigns</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeCampaigns}</p>
              </div>
              <Users className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Posters Created</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalPosters}</p>
              </div>
              <Download className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">All Campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posters
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{campaign.title}</p>
                        {campaign.description && (
                          <p className="text-sm text-gray-500 truncate max-w-md">
                            {campaign.description}
                          </p>
                        )}
                        {/* Show subscription period */}
                        {(campaign as any).startDate && (campaign as any).endDate && (
                          <p className="text-xs text-gray-400 mt-1">
                            📅 {new Date((campaign as any).startDate).toLocaleDateString()} - {new Date((campaign as any).endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            (campaign as any).isCurrentlyActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(campaign as any).isCurrentlyActive ? '✅ Active' : '❌ Expired'}
                        </span>
                        {! (campaign as any).isCurrentlyActive && campaign.status === 'active' && (
                          <span className="text-xs text-gray-500">
                            Subscription ended
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.posterCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/campaigns/${campaign._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Campaign Page"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditCampaign(campaign)}
                          className="text-green-600 hover:text-green-900"
                          title="Edit Campaign Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(campaign._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {campaigns.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No campaigns yet. Create your first campaign!
              </div>
            )}
          </div>
        </div>

        {/* Recent Posters */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Posters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {posters.slice(0, 6).map((poster) => (
              <div
                key={poster._id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${poster.generatedImageUrl}`}
                  alt="Poster"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  <p className="font-medium text-gray-900">{poster.supporterName}</p>
                  <p className="text-sm text-gray-500">
                    {poster.designation || 'No designation'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(poster.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {posters.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No posters created yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
