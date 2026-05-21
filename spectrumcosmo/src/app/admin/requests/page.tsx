'use client';

import { useEffect, useState } from 'react';
import { Loader2, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Image from 'next/image';

interface Request {
  id: string;
  title: string;
  description: string;
  category_name: string;
  category_id: number | null;
  status: string;
  user_name: string;
  user_email: string;
  like_count: number;
  image_count: number;
  created_at: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/requests?status=${filter}`);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: string) => {
    setProcessing(true);
    try {
      await fetch('/api/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus, admin_notes: adminNote }),
      });
      setSelectedRequest(null);
      setAdminNote('');
      await fetchRequests();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setProcessing(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    reviewing: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    sourcing: 'bg-purple-100 text-purple-700',
    available: 'bg-teal-100 text-teal-700',
  };

  if (loading) {
    return (
      <div className="pt-16 lg:pt-0">
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Product Requests</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage community submissions.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['pending', 'reviewing', 'approved', 'rejected', 'sourcing', 'available'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === s ? 'bg-orange-500 text-white' : 'bg-white border text-gray-600'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No requests found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{req.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{req.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{req.user_name}</p>
                      <p className="text-xs text-gray-400">{req.user_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">{req.category_name || '—'}</td>
                    <td className="px-6 py-4 text-sm">{req.like_count}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Review Request</h2>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="text-sm text-gray-500">User</label><p className="font-medium">{selectedRequest.user_name} ({selectedRequest.user_email})</p></div>
              <div><label className="text-sm text-gray-500">Title</label><p className="font-medium">{selectedRequest.title}</p></div>
              <div><label className="text-sm text-gray-500">Description</label><p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p></div>
              <div><label className="text-sm text-gray-500">Category</label><p>{selectedRequest.category_name || 'Not specified'}</p></div>
              <div><label className="text-sm text-gray-500">Likes</label><p>{selectedRequest.like_count}</p></div>
              <div>
                <label className="text-sm text-gray-500 block mb-2">Admin Notes (optional)</label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full border rounded-xl px-4 py-2"
                  placeholder="Add internal notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'approved')}
                  disabled={processing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700"
                >
                  <CheckCircle size={16} className="inline mr-2" /> Approve
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'rejected')}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl hover:bg-red-700"
                >
                  <XCircle size={16} className="inline mr-2" /> Reject
                </button>
                <button
                  onClick={() => updateStatus(selectedRequest.id, 'reviewing')}
                  disabled={processing}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
                >
                  <Clock size={16} className="inline mr-2" /> Start Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
