'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader, AlertCircle, Plus, Trash2, Edit2, Archive, RotateCcw, Clock, Send } from 'lucide-react';
import { useListAdminBlogPostsQuery, useDeleteBlogPostMutation, useUpdateBlogPostMutation } from '@/store/slices/blogSlice';
import BlogCreateModal from './BlogCreateModal';
import Button from '@/components/Button';

export default function BlogListTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [status, setStatus] = useState<'all' | 'draft' | 'published' | 'archived' | 'scheduled'>('all');
  const [page, setPage] = useState(1);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'publish' | 'archive' | 'restore' | 'delete' | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [bulkModal, setBulkModal] = useState<{
    isOpen: boolean;
    action: 'delete' | 'archive' | 'publish' | null;
    count: number;
  }>({ isOpen: false, action: null, count: 0 });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'publish' | 'archive' | 'restore' | 'delete' | null;
    postId: string | null;
  }>({ isOpen: false, action: null, postId: null });
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ isOpen: false, message: '', type: 'info' });
  useEffect(() => {
    if (!toast.isOpen) return;
    
    const timer = setTimeout(() => {
      setToast({ isOpen: false, message: '', type: 'info' });
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [toast.isOpen]);

  const { data, isLoading, error, refetch } = useListAdminBlogPostsQuery({
    status: status === 'all' || status === 'scheduled' ? undefined : (status as any),
    page,
    limit: 20,
  });

  const [deleteBlog] = useDeleteBlogPostMutation();
  const [updateBlog] = useUpdateBlogPostMutation();

  const filteredPosts = useMemo(() => {
    if (status !== 'scheduled') return data?.posts || [];
    return (data?.posts || []).filter((post: any) => post.scheduledAt && new Date(post.scheduledAt) > new Date() && post.status === 'draft');
  }, [data?.posts, status]);

  const posts = filteredPosts;
  const pagination = data?.pagination;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getScheduledCountdown = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) return 'Publishing now...';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const handleDelete = (id: string) => {
    const post = posts.find((p: any) => p.id === id);
    if (!post) return;

    setConfirmModal({ isOpen: true, action: 'delete', postId: id });
  };

  const confirmArchive = async () => {
    const id = confirmModal.postId;
    if (!id) return;
    setConfirmModal({ isOpen: false, action: null, postId: null });

    try {
      setActioningId(id);
      setCurrentAction('archive');
      await updateBlog({
        id,
        status: 'archived',
      }).unwrap();
      setToast({ isOpen: true, message: 'Post archived successfully', type: 'success' });
      refetch();
    } catch (error: any) {
      const errorMessage = error?.data?.error?.message || 'Failed to archive post';
      setToast({ isOpen: true, message: errorMessage, type: 'error' });
      console.error('Archive error:', error);
    } finally {
      setActioningId(null);
      setCurrentAction(null);
    }
  };

  const handleArchive = (id: string) => {
    setConfirmModal({ isOpen: true, action: 'archive', postId: id });
  };

  const confirmDelete = async () => {
    const id = confirmModal.postId;
    if (!id) return;
    setConfirmModal({ isOpen: false, action: null, postId: null });

    try {
      setActioningId(id);
      setCurrentAction('delete');
      await deleteBlog(id).unwrap();
      setToast({ isOpen: true, message: 'Post deleted successfully', type: 'success' });
      refetch();
    } catch (error: any) {
      const errorMessage = error?.data?.error?.message || 'Failed to delete post';
      setToast({ isOpen: true, message: errorMessage, type: 'error' });
      console.error('Delete error:', error);
    } finally {
      setActioningId(null);
      setCurrentAction(null);
    }
  };

  const confirmRestore = async () => {
    const id = confirmModal.postId;
    if (!id) return;
    setConfirmModal({ isOpen: false, action: null, postId: null });

    try {
      setActioningId(id);
      setCurrentAction('restore');
      await updateBlog({
        id,
        status: 'draft',
      }).unwrap();
      setToast({ isOpen: true, message: 'Post restored successfully', type: 'success' });
      refetch();
    } catch (error: any) {
      const errorMessage = error?.data?.error?.message || 'Failed to restore post';
      setToast({ isOpen: true, message: errorMessage, type: 'error' });
      console.error('Restore error:', error);
    } finally {
      setActioningId(null);
      setCurrentAction(null);
    }
  };

  const handleRestore = (id: string) => {
    setConfirmModal({ isOpen: true, action: 'restore', postId: id });
  };

  const handlePublish = async (id: string) => {
    setConfirmModal({ isOpen: true, action: 'publish', postId: id });
  };

  const confirmPublish = async () => {
    const id = confirmModal.postId;
    if (!id) return;
    setConfirmModal({ isOpen: false, action: null, postId: null });

    const post = posts.find((p: any) => p.id === id);
    if (!post) {
      setToast({ isOpen: true, message: 'Post not found', type: 'error' });
      return;
    }

    try {
      setActioningId(id);
      setCurrentAction('publish');
      await updateBlog({
        id,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        status: 'published',
        featured: post.featured,
        authorIds: post.authors?.map((a: any) => a.userId) || [],
        featuredImage: post.featuredImage,
      }).unwrap();

      setToast({ isOpen: true, message: 'Post published successfully', type: 'success' });
      refetch();
    } catch (error: any) {
      const errorMessage = error?.data?.error?.message || error?.message || 'Failed to publish post';
      setToast({ isOpen: true, message: `Publish failed: ${errorMessage}`, type: 'error' });
      console.error('Publish error:', error);
    } finally {
      setActioningId(null);
      setCurrentAction(null);
    }
  };
  const togglePostSelection = (id: string) => {
    const newSelected = new Set(selectedPostIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPostIds(newSelected);
    setSelectAll(false);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedPostIds(new Set<string>());
      setSelectAll(false);
    } else {
      const allIds = new Set<string>(posts.map((p: any) => p.id));
      setSelectedPostIds(allIds);
      setSelectAll(true);
    }
  };

  const clearSelection = () => {
    setSelectedPostIds(new Set<string>());
    setSelectAll(false);
  };

  const performBulkAction = async (action: 'delete' | 'archive' | 'publish') => {
    const ids = Array.from(selectedPostIds);
    setBulkModal({ isOpen: false, action: null, count: 0 });

    try {
      setActioningId('bulk');
      let successCount = 0;
      let errorCount = 0;

      for (const id of ids) {
        try {
          if (action === 'delete') {
            await deleteBlog(id).unwrap();
          } else if (action === 'archive') {
            await updateBlog({ id, status: 'archived' }).unwrap();
          } else if (action === 'publish') {
            const post = posts.find((p: any) => p.id === id);
            await updateBlog({
              id,
              status: 'published',
              title: post.title,
              excerpt: post.excerpt,
              content: post.content,
              category: post.category,
              featured: post.featured,
              authorIds: post.authors?.map((a: any) => a.userId) || [],
              featuredImage: post.featuredImage,
            }).unwrap();
          }
          successCount++;
        } catch (err) {
          errorCount++;
        }
      }

      clearSelection();
      const actionText = action === 'delete' ? 'deleted' : action === 'archive' ? 'archived' : 'published';
      setToast({
        isOpen: true,
        message: errorCount === 0 
          ? `${successCount} post${successCount > 1 ? 's' : ''} ${actionText} successfully`
          : `${successCount} succeeded, ${errorCount} failed`,
        type: errorCount === 0 ? 'success' : 'error',
      });
      refetch();
    } catch (error) {
      setToast({ isOpen: true, message: `Bulk action failed`, type: 'error' });
    } finally {
      setActioningId(null);
    }
  };
  const displayPosts = useMemo(() => {
    let result = posts;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((post: any) =>
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((post: any) => post.category === categoryFilter);
    }
    if (sortBy === 'oldest') {
      result = [...result].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'title') {
      result = [...result].sort((a: any, b: any) => a.title.localeCompare(b.title));
    } else {
      result = [...result].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [posts, searchTerm, categoryFilter, sortBy]);

  const uniqueCategories = useMemo(() => {
    return [...new Set<string>(data?.posts?.map((p: any) => p.category) || [])] as string[];
  }, [data?.posts]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by title or excerpt..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Posts</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="scheduled">⏰ Scheduled</option>
          </select>

          {/* Category Filter */}
          {uniqueCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">By Title (A-Z)</option>
          </select>

          <div className="flex-1" />

          <Button
            onClick={() => setShowCreate(true)}
            variant="primary"
            size="md"
            className="inline-flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedPostIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-blue-900">
            {selectedPostIds.size} post{selectedPostIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              onClick={() => setBulkModal({ isOpen: true, action: 'publish', count: selectedPostIds.size })}
              variant="outline"
              size="sm"
              className="text-primary-700 border-primary-200 hover:bg-primary-50"
            >
              <Send className="w-4 h-4" />
              Publish
            </Button>
            <Button
              onClick={() => setBulkModal({ isOpen: true, action: 'archive', count: selectedPostIds.size })}
              variant="outline"
              size="sm"
              className="text-orange-700 border-orange-200 hover:bg-orange-50"
            >
              <Archive className="w-4 h-4" />
              Archive
            </Button>
            <Button
              onClick={() => setBulkModal({ isOpen: true, action: 'delete', count: selectedPostIds.size })}
              variant="outline"
              size="sm"
              className="text-red-700 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <Button
              onClick={clearSelection}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Loader className="w-10 h-10 animate-spin mx-auto mb-3 text-primary-600" />
          <p className="text-gray-600 font-medium">Loading blog posts...</p>
        </motion.div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">Failed to load posts</p>
            <p className="text-xs text-red-700 mt-1">Please try refreshing the page or contact support</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium underline"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      )}

      {/* Posts List */}
      {!isLoading && !error && displayPosts.length > 0 && (
        <div className="space-y-3">
          {/* Results count */}
          <div className="text-sm text-gray-600 font-medium">
            Showing <span className="text-gray-900 font-semibold">{displayPosts.length}</span> of <span className="text-gray-900 font-semibold">{posts.length}</span> posts
          </div>
          
          {/* Select all checkbox */}
          {displayPosts.length > 0 && (
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={toggleSelectAll}
                className="w-5 h-5 cursor-pointer rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectAll ? `Deselect all (${displayPosts.length})` : `Select all (${displayPosts.length})`}
              </span>
            </label>
          )}

          <div className="grid gap-4 auto-rows-max">
            {displayPosts.map((post: any, index: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white border-2 rounded-xl p-6 hover:shadow-md transition-all duration-200 group cursor-pointer ${
                  selectedPostIds.has(post.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-200'
                }`}
                onClick={() => togglePostSelection(post.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Checkbox */}
                  <div className="flex items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      checked={selectedPostIds.has(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 mt-1 cursor-pointer rounded border-gray-300 text-primary-600"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors line-clamp-2">{post.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">{post.excerpt}</p>
                    
                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-2.5 text-xs mb-3">
                      <span className="px-3 py-1.5 bg-linear-to-r from-gray-50 to-gray-100 text-gray-700 rounded-full font-semibold border border-gray-200">
                        {post.category}
                      </span>
                      <span
                        className={`px-3 py-1.5 rounded-full text-white font-semibold ${
                          post.status === 'published'
                            ? 'bg-primary-600 shadow-sm'
                            : post.status === 'draft'
                              ? 'bg-yellow-600 shadow-sm'
                              : 'bg-gray-600 shadow-sm'
                        }`}
                      >
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                      {post.featured && (
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-semibold border border-blue-200">
                          ⭐ Featured
                        </span>
                      )}
                      {post.scheduledAt && new Date(post.scheduledAt) > new Date() && (
                        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full font-semibold border border-purple-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getScheduledCountdown(post.scheduledAt)}
                      </span>
                    )}
                  </div>

                  {/* Published/Scheduled Info */}
                  <div className="text-xs text-gray-500 mb-3 space-y-1">
                    {post.publishedAt && (
                      <p>Published: <span className="text-gray-700 font-medium">{formatDate(post.publishedAt)}</span></p>
                    )}
                    {post.scheduledAt && new Date(post.scheduledAt) > new Date() && (
                      <p>Scheduled: <span className="text-purple-700 font-medium">{formatDate(post.scheduledAt)}</span></p>
                    )}
                  </div>

                  {/* Authors */}
                  {post.authors && post.authors.length > 0 && (
                    <div className="text-xs text-gray-500 font-medium">
                      <span className="text-gray-700">Authors: </span>{post.authors.map((a: any) => a.user?.name || a.name || a.email || 'Unknown').join(', ')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap shrink-0 sm:ml-auto justify-end" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingPostId(post.id); }}
                    className="px-4 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 border border-primary-200 hover:border-primary-300 flex items-center gap-2"
                    title="Edit post"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                  {post.status === 'draft' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePublish(post.id); }}
                      disabled={actioningId === post.id}
                      className="px-4 py-2.5 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all duration-200 border border-primary-200 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Publish draft post"
                    >
                      {actioningId === post.id && currentAction === 'publish' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Publish</span>
                    </button>
                  )}
                  {post.status === 'archived' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRestore(post.id); }}
                      disabled={actioningId === post.id}
                      className="px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Restore post"
                    >
                      {actioningId === post.id && currentAction === 'restore' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Restore</span>
                    </button>
                  )}
                  {post.status === 'published' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleArchive(post.id); }}
                      disabled={actioningId === post.id}
                      className="px-4 py-2.5 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all duration-200 border border-orange-200 hover:border-orange-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Archive post"
                    >
                      {actioningId === post.id && currentAction === 'archive' ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Archive className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">Archive</span>
                    </button>
                  )}
                  {post.status !== 'published' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                      disabled={actioningId === post.id}
                      className="px-4 py-2.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Permanently delete post"
                    >
                      {actioningId === post.id && currentAction === 'delete' ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && !error && posts.length > 0 && displayPosts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200"
        >
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts match your filters</h3>
          <p className="text-sm text-gray-600 mb-6">Try adjusting your search terms, category, or status filters</p>
          <Button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setSortBy('newest');
            }}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200"
        >
          <Plus className="w-12 h-12 text-primary-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No blog posts yet</h3>
          <p className="text-sm text-gray-600 mb-6">Create your first blog post to get started</p>
          <Button
            onClick={() => setShowCreate(true)}
            variant="primary"
            size="sm"
          >
            Create Post
          </Button>
        </motion.div>
      )}

      {/* Pagination */}
      {!isLoading && !error && pagination && pagination.pages > 1 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="flex items-center justify-between pt-6 border-t border-gray-200"
        >
          <p className="text-sm text-gray-600">
            Page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span>
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || editingPostId) && <BlogCreateModal 
        editingPostId={editingPostId || undefined}
        onClose={() => {
          setShowCreate(false);
          setEditingPostId(null);
          refetch();
        }} 
      />}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmModal.action === 'publish' && 'Publish Post?'}
              {confirmModal.action === 'archive' && 'Archive Post?'}
              {confirmModal.action === 'restore' && 'Restore Post?'}
              {confirmModal.action === 'delete' && 'Delete Post?'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmModal.action === 'publish' && 'This draft post will be published and become visible to readers.'}
              {confirmModal.action === 'archive' && 'Published posts cannot be deleted. Archive this post instead?'}
              {confirmModal.action === 'restore' && 'This post will be restored to draft status.'}
              {confirmModal.action === 'delete' && 'This action cannot be undone. The post will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null, postId: null })}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.action === 'publish') confirmPublish();
                  if (confirmModal.action === 'archive') confirmArchive();
                  if (confirmModal.action === 'restore') confirmRestore();
                  if (confirmModal.action === 'delete') confirmDelete();
                }}
                disabled={actioningId === confirmModal.postId}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  confirmModal.action === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actioningId === confirmModal.postId && <Loader className="w-4 h-4 animate-spin" />}
                {confirmModal.action === 'publish' && 'Publish'}
                {confirmModal.action === 'archive' && 'Archive'}
                {confirmModal.action === 'restore' && 'Restore'}
                {confirmModal.action === 'delete' && 'Delete'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Bulk Action Confirmation Modal */}
      {bulkModal.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {bulkModal.action === 'publish' && `Publish ${bulkModal.count} Post${bulkModal.count > 1 ? 's' : ''}?`}
              {bulkModal.action === 'archive' && `Archive ${bulkModal.count} Post${bulkModal.count > 1 ? 's' : ''}?`}
              {bulkModal.action === 'delete' && `Delete ${bulkModal.count} Post${bulkModal.count > 1 ? 's' : ''}?`}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {bulkModal.action === 'publish' && 'All selected draft posts will be published and become visible to readers.'}
              {bulkModal.action === 'archive' && 'All selected posts will be archived.'}
              {bulkModal.action === 'delete' && 'This action cannot be undone. All selected draft posts will be permanently deleted.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkModal({ isOpen: false, action: null, count: 0 })}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => bulkModal.action && performBulkAction(bulkModal.action)}
                disabled={actioningId === 'bulk'}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  bulkModal.action === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actioningId === 'bulk' && <Loader className="w-4 h-4 animate-spin" />}
                {bulkModal.action === 'publish' && 'Publish All'}
                {bulkModal.action === 'archive' && 'Archive All'}
                {bulkModal.action === 'delete' && 'Delete All'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Toast Notification */}
      {toast.isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 z-40 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-sm ${
            toast.type === 'success'
              ? 'bg-primary-50 border border-primary-200'
              : toast.type === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success'
                ? 'bg-green-100'
                : toast.type === 'error'
                ? 'bg-red-100'
                : 'bg-blue-100'
            }`}
          >
            <span
              className={`text-sm font-bold ${
                toast.type === 'success'
                  ? 'text-green-600'
                  : toast.type === 'error'
                  ? 'text-red-600'
                  : 'text-blue-600'
              }`}
            >
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '!'}
              {toast.type === 'info' && 'i'}
            </span>
          </div>
          <p
            className={`text-sm font-medium ${
              toast.type === 'success'
                ? 'text-green-900'
                : toast.type === 'error'
                ? 'text-red-900'
                : 'text-blue-900'
            }`}
          >
            {toast.message}
          </p>
          <button
            onClick={() => setToast({ isOpen: false, message: '', type: 'info' })}
            className={`ml-auto text-lg font-bold opacity-60 hover:opacity-100 transition-opacity ${
              toast.type === 'success'
                ? 'text-green-600'
                : toast.type === 'error'
                ? 'text-red-600'
                : 'text-blue-600'
            }`}
          >
            ×
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
