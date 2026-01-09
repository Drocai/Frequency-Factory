import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Music, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Shield,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  teal: '#14B8A6',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  gray600: '#3A3A3A',
  white: '#FFFFFF',
};

type Tab = 'overview' | 'submissions' | 'users' | 'activity';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Check admin access
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.gray900 }}>
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: colors.gray900 }}>
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-6">You need admin privileges to access this page.</p>
        <Button onClick={() => setLocation('/feed')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: colors.gray900 }}>
      {/* Header */}
      <header 
        className="p-4 flex items-center justify-between sticky top-0 z-10"
        style={{ background: colors.gray800, borderBottom: `1px solid ${colors.gray700}` }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation('/feed')} className="p-2 hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm">Manage submissions, users, and content</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400">
            Admin
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: colors.gray700 }}>
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'submissions', label: 'Submissions', icon: Music },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'activity', label: 'Activity', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition ${
              activeTab === tab.id 
                ? 'text-orange-400 border-b-2 border-orange-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'submissions' && (
          <SubmissionsTab 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
          />
        )}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab() {
  const { data: stats, isLoading, refetch } = trpc.admin.getStats.useQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const statCards = [
    { label: 'Total Submissions', value: stats?.totalSubmissions || 0, icon: Music, color: colors.primary },
    { label: 'Pending Review', value: stats?.pendingSubmissions || 0, icon: Clock, color: colors.yellow },
    { label: 'Approved', value: stats?.approvedSubmissions || 0, icon: CheckCircle, color: colors.green },
    { label: 'Rejected', value: stats?.rejectedSubmissions || 0, icon: XCircle, color: colors.red },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: colors.teal },
    { label: 'Total Comments', value: stats?.totalComments || 0, icon: Activity, color: colors.primaryLight },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl"
            style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
          >
            <stat.icon className="w-6 h-6 mb-2" style={{ color: stat.color }} />
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-gray-400 text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Submissions Tab
function SubmissionsTab({ 
  statusFilter, 
  setStatusFilter, 
  selectedIds, 
  setSelectedIds,
  expandedId,
  setExpandedId
}: {
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
}) {
  const { data: submissions, isLoading, refetch } = trpc.admin.getSubmissions.useQuery({ 
    status: statusFilter === 'all' ? undefined : statusFilter 
  });

  const updateStatus = trpc.admin.updateSubmissionStatus.useMutation({
    onSuccess: () => {
      toast.success('Status updated');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkUpdate = trpc.admin.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated ${data?.count} submissions`);
      setSelectedIds([]);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteSubmission = trpc.admin.deleteSubmission.useMutation({
    onSuccess: () => {
      toast.success('Submission deleted');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(
      selectedIds.includes(id) ? selectedIds.filter((i: number) => i !== id) : [...selectedIds, id]
    );
  };

  const selectAll = () => {
    if (submissions) {
      setSelectedIds(selectedIds.length === submissions.length ? [] : submissions.map(s => s.id));
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Filters & Actions */}
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                statusFilter === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <span className="text-gray-400 text-sm self-center">{selectedIds.length} selected</span>
            <Button 
              size="sm" 
              onClick={() => bulkUpdate.mutate({ ids: selectedIds, status: 'approved' })}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
            <Button 
              size="sm" 
              onClick={() => bulkUpdate.mutate({ ids: selectedIds, status: 'rejected' })}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        )}
      </div>

      {/* Table Header */}
      <div 
        className="grid grid-cols-12 gap-4 p-4 text-gray-400 text-sm font-medium rounded-t-xl"
        style={{ background: colors.gray800 }}
      >
        <div className="col-span-1">
          <input 
            type="checkbox" 
            checked={submissions?.length === selectedIds.length && submissions?.length > 0}
            onChange={selectAll}
            className="rounded"
          />
        </div>
        <div className="col-span-3">Track</div>
        <div className="col-span-2">Artist</div>
        <div className="col-span-2">Genre</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Actions</div>
      </div>

      {/* Submissions List */}
      <div className="space-y-1">
        {submissions?.map((sub: any) => (
          <div key={sub.id}>
            <div 
              className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-800/50 transition cursor-pointer"
              style={{ background: colors.gray800, borderBottom: `1px solid ${colors.gray700}` }}
              onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
            >
              <div className="col-span-1" onClick={e => e.stopPropagation()}>
                <input 
                  type="checkbox" 
                  checked={selectedIds.includes(sub.id)}
                  onChange={() => toggleSelect(sub.id)}
                  className="rounded"
                />
              </div>
              <div className="col-span-3 text-white font-medium truncate">{sub.trackTitle}</div>
              <div className="col-span-2 text-gray-300 truncate">{sub.artistName}</div>
              <div className="col-span-2 text-gray-400 text-sm">{sub.genre || '—'}</div>
              <div className="col-span-2">
                <StatusBadge status={sub.status} />
              </div>
              <div className="col-span-2 flex gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => updateStatus.mutate({ id: sub.id, status: 'approved' })}
                  className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  title="Approve"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => updateStatus.mutate({ id: sub.id, status: 'rejected' })}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  title="Reject"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this submission?')) {
                      deleteSubmission.mutate({ id: sub.id });
                    }
                  }}
                  className="p-2 rounded-lg bg-gray-700 text-gray-400 hover:bg-gray-600"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedId === sub.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 self-center" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 self-center" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedId === sub.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                  style={{ background: colors.gray700 }}
                >
                  <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Ticket</p>
                      <p className="text-white">{sub.ticketNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Email</p>
                      <p className="text-white">{sub.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Platform</p>
                      <p className="text-white">{sub.platform || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">AI Assisted</p>
                      <p className="text-white">{sub.aiAssisted ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400">Streaming Link</p>
                      {sub.streamingLink ? (
                        <a 
                          href={sub.streamingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-orange-400 hover:underline flex items-center gap-1"
                        >
                          {sub.streamingLink.slice(0, 50)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <p className="text-white">—</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-400">Notes</p>
                      <p className="text-white">{sub.notes || '—'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {(!submissions || submissions.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            No submissions found
          </div>
        )}
      </div>
    </div>
  );
}

// Users Tab
function UsersTab() {
  const { data: users, isLoading, refetch } = trpc.admin.getUsers.useQuery();

  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success('User role updated');
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">User Management</h2>

      <div 
        className="rounded-xl overflow-hidden"
        style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
      >
        <div className="grid grid-cols-12 gap-4 p-4 text-gray-400 text-sm font-medium border-b" style={{ borderColor: colors.gray700 }}>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Tokens</div>
          <div className="col-span-2">Actions</div>
        </div>

        {users?.map((user: any) => (
          <div 
            key={user.id}
            className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-b-0"
            style={{ borderColor: colors.gray700 }}
          >
            <div className="col-span-3 text-white font-medium">{user.name || 'Anonymous'}</div>
            <div className="col-span-3 text-gray-400 text-sm truncate">{user.email || '—'}</div>
            <div className="col-span-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                user.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-300'
              }`}>
                {user.role}
              </span>
            </div>
            <div className="col-span-2 text-white">{user.tokenBalance} FT</div>
            <div className="col-span-2">
              <select
                value={user.role}
                onChange={(e) => updateRole.mutate({ userId: user.id, role: e.target.value as 'user' | 'admin' })}
                className="px-3 py-1 rounded-lg text-sm bg-gray-700 text-white border-none outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        ))}

        {(!users || users.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}

// Activity Tab
function ActivityTab() {
  const { data: activities, isLoading } = trpc.admin.getRecentActivity.useQuery();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>

      <div className="space-y-3">
        {activities?.map((activity: any, i: number) => (
          <motion.div
            key={`${activity.type}-${activity.id}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ 
                background: activity.type === 'submission' ? colors.primary + '20' : colors.teal + '20',
                color: activity.type === 'submission' ? colors.primary : colors.teal,
              }}
            >
              {activity.type === 'submission' ? <Music className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="text-white">{activity.description}</p>
              <p className="text-gray-500 text-sm">
                {new Date(activity.createdAt).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}

        {(!activities || activities.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-700 text-gray-300'}`}>
      {status}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
}
