'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader, Search, X, Image as ImageIcon } from 'lucide-react';
import { useGenerateBlogPostMutation, useCreateBlogPostMutation, useUpdateBlogPostMutation, useGetAdminBlogPostQuery, useUploadBlogFeaturedImageMutation } from '@/store/slices/blogSlice';
import { useUsers } from '@/hooks/useUserStats';
import RichTextEditor from '@/components/AutoEmails/RichTextEditor';
import Button from '@/components/Button';

interface BlogCreateTabProps {
  editingPostId?: string;
  onClose?: () => void;
}

export default function BlogCreateTab({ editingPostId, onClose }: BlogCreateTabProps) {
  const { data: editingPost } = useGetAdminBlogPostQuery(editingPostId!, { skip: !editingPostId });
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [aiPrompt, setAiPrompt] = useState('');
  const [authorSearch, setAuthorSearch] = useState('');
  const [formData, setFormData] = useState<{
    title: string;
    excerpt: string;
    content: string;
    category: string;
    featured: boolean;
    status: 'draft' | 'published';
    authorIds: string[];
    featuredImage?: string;
    scheduledAt?: string;
  }>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    featured: false,
    status: 'draft',
    authorIds: [] as string[],
    featuredImage: '',
    scheduledAt: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' }>({ isOpen: false, message: '', type: 'success' });

  const { data: usersData, loading: usersLoading, error: usersError } = useUsers({ limit: 100, offset: 0 });
  const [generateBlog, { isLoading: isGenerating }] = useGenerateBlogPostMutation();
  const [createBlog, { isLoading: isCreating }] = useCreateBlogPostMutation();
  const [updateBlog, { isLoading: isUpdating }] = useUpdateBlogPostMutation();
  const [uploadImage, { isLoading: isUploading }] = useUploadBlogFeaturedImageMutation();
  const [imageUploadProgress, setImageUploadProgress] = useState(0);

  const filteredUsers = useMemo(() => {
    const users = usersData?.users || [];
    if (!authorSearch.trim()) return users;
    const searchLower = authorSearch.toLowerCase();
    return users.filter((user: any) => 
      user.name?.toLowerCase().includes(searchLower) || 
      user.email?.toLowerCase().includes(searchLower)
    );
  }, [usersData?.users, authorSearch]);

  const selectedAuthors = useMemo(() => {
    const users = usersData?.users || [];
    return users.filter((u: any) => formData.authorIds.includes(u.id));
  }, [usersData?.users, formData.authorIds]);
  useEffect(() => {
    if (editingPost) {
      setFormData({
        title: editingPost.title || '',
        excerpt: editingPost.excerpt || '',
        content: editingPost.content || '',
        category: editingPost.category || '',
        featured: editingPost.featured || false,
        status: editingPost.status || 'draft',
        authorIds: editingPost.authors?.map((a: any) => a.userId) || [],
        featuredImage: editingPost.featuredImage || '',
        scheduledAt: editingPost.scheduledAt ? new Date(editingPost.scheduledAt).toISOString().slice(0, 16) : '',
      });
    }
  }, [editingPost]);

  const handleGenerateFromAI = async () => {
    if (!aiPrompt.trim()) {
      setError('Please enter a blog topic');
      return;
    }
    setError('');
    setSuccessMessage('');
    try {
      const result = await generateBlog({
        prompt: aiPrompt,
        category: formData.category || undefined,
      }).unwrap();
      setFormData((prev) => ({
        ...prev,
        title: result.title || '',
        excerpt: result.excerpt || '',
        content: result.content || '',
      }));
      setMode('manual');
      setAiPrompt('');
      setToast({ isOpen: true, message: 'Blog content generated successfully!', type: 'success' });
      setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3000);
    } catch (err) {
      setError('Failed to generate blog post from AI. Please try again.');
      console.error('AI generation error:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WebP)');
      return;
    }

    try {
      setError('');
      setImageUploadProgress(30);

      const formDataToSend = new FormData();
      formDataToSend.append('file', file);

      setImageUploadProgress(60);
      const result = await uploadImage(formDataToSend).unwrap();
      setImageUploadProgress(100);

      setFormData((prev) => ({
        ...prev,
        featuredImage: result.url,
      }));

      setToast({ isOpen: true, message: 'Featured image uploaded successfully!', type: 'success' });
      setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3000);
      setImageUploadProgress(0);

      if (e.target) e.target.value = '';
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Image upload error:', err);
      setImageUploadProgress(0);
    }
  };

  const handleClearImage = () => {
    setFormData((prev) => ({
      ...prev,
      featuredImage: '',
    }));
  };

  const handleCreate = async () => {
    setError('');
    setSuccessMessage('');
    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.excerpt?.trim()) {
      setError('Excerpt is required');
      return;
    }
    if (!formData.content?.trim()) {
      setError('Content is required');
      return;
    }
    if (!formData.category?.trim()) {
      setError('Category is required');
      return;
    }
    if (formData.authorIds.length === 0) {
      setError('Select at least one author');
      return;
    }

    if (formData.scheduledAt && formData.status === 'draft') {
      const scheduledDate = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledDate <= now) {
        setError('Scheduled date must be in the future');
        return;
      }
    }

    try {
      if (editingPostId) {
        await updateBlog({
          id: editingPostId,
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          featured: formData.featured,
          status: formData.status,
          authorIds: formData.authorIds,
          featuredImage: formData.featuredImage,
          scheduledAt: formData.scheduledAt || undefined,
        }).unwrap();
        
        setToast({ isOpen: true, message: 'Blog post updated successfully!', type: 'success' });
        setTimeout(() => onClose?.(), 500);
      } else {
        await createBlog({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          featured: formData.featured,
          status: formData.status,
          authorIds: formData.authorIds,
          featuredImage: formData.featuredImage,
          scheduledAt: formData.scheduledAt || undefined,
        }).unwrap();
        
        setToast({ isOpen: true, message: 'Blog post created successfully!', type: 'success' });
        setTimeout(() => onClose?.(), 500);
        setFormData({
          title: '',
          excerpt: '',
          content: '',
          category: '',
          featured: false,
          status: 'draft',
          authorIds: [],
          featuredImage: '',
          scheduledAt: '',
        });
      }
    } catch (err: any) {
      const action = editingPostId ? 'update' : 'create';
      setError(err?.data?.error?.message || `Failed to ${action} blog post`);
      console.error(`${action} blog error:`, err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl">
      {/* Mode Toggle */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {(['manual', 'ai'] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setError('');
              setSuccessMessage('');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              mode === m
                ? 'bg-primary-700 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {m === 'ai' && <Sparkles className="w-4 h-4" />}
            {m === 'manual' ? 'Write Manually' : 'Generate with AI'}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-3"
        >
          <span className="text-red-600 text-lg">⚠️</span>
          <p>{error}</p>
        </motion.div>
      )}

      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary-50 border border-primary-200 rounded-lg text-sm text-primary-700 flex items-start gap-3"
        >
          <span className="text-primary-600 text-lg">✓</span>
          <p>{successMessage}</p>
        </motion.div>
      )}

      {/* AI Mode */}
      {mode === 'ai' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-4 bg-linear-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              📝 Blog Topic
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Write about the benefits of eSIM for digital nomads..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-600 mt-2">Be specific about what you want the blog post to cover</p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">📂 Category</label>
            <select
              value={formData?.category || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="Technology">Technology</option>
              <option value="Travel">Travel</option>
              <option value="How-To">How-To</option>
              <option value="Education">Education</option>
              <option value="News">News</option>
            </select>
          </div>

          <Button
            onClick={handleGenerateFromAI}
            disabled={isGenerating || !aiPrompt.trim()}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Manual/Edit Mode */}
      {mode === 'manual' && (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter blog post title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{(formData?.title?.length || 0)}/200 characters</p>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Excerpt <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Brief summary of the blog post (100-150 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-gray-500 mt-1">{(formData?.excerpt?.length || 0)}/300 characters</p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Content <span className="text-red-600">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
              />
            </div>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Featured Image <span className="text-gray-500 text-xs font-normal">(Optional)</span>
            </label>
            {formData.featuredImage ? (
              <div className="relative">
                <img
                  src={formData.featuredImage}
                  alt="Featured preview"
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-600 mt-2">Click X to change the image</p>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="featured-image-input"
                />
                <label
                  htmlFor="featured-image-input"
                  className={`flex flex-col items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200 ${
                    isUploading ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'hover:border-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  {isUploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin text-primary-600 mb-1" />
                      <p className="text-sm text-gray-600">Uploading... {imageUploadProgress}%</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">Click to upload featured image</p>
                      <p className="text-xs text-gray-600 mt-1">PNG, JPG, WebP up to 10MB</p>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="Technology">Technology</option>
              <option value="Travel">Travel</option>
              <option value="How-To">How-To</option>
              <option value="Education">Education</option>
              <option value="News">News</option>
            </select>
          </div>

          {/* Status & Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="published">Publish Now</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Drafts won't be visible to public</p>
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mt-8">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>⭐ Feature this post</span>
              </label>
            </div>
          </div>

          {/* Scheduled Publishing */}
          {formData.status === 'draft' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">📅 Schedule Publishing (Optional)</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to publish manually. Must be in the future.</p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">Status</label>
            <div className="flex gap-3">
              {(['draft', 'published'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFormData((prev) => ({ ...prev, status: s }))}
                  className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    formData.status === s
                      ? 'bg-primary-700 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s === 'draft' ? '📝 Draft' : '🚀 Published'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Authors <span className="text-red-600">*</span>
            </label>
            
            {/* Selected Authors */}
            {selectedAuthors.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {selectedAuthors.map((author: any) => (
                  <div
                    key={author.id}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    <span>{author.name || author.email}</span>
                    <button
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          authorIds: prev.authorIds.filter((id) => id !== author.id),
                        }));
                      }}
                      className="hover:text-primary-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={authorSearch}
                onChange={(e) => setAuthorSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Authors List */}
            {usersLoading ? (
              <div className="py-6 text-center text-gray-500">
                <Loader className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading users...</p>
              </div>
            ) : usersError ? (
              <div className="py-4 text-center text-red-600 text-sm">
                Failed to load users
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                {authorSearch ? 'No users found' : 'No users available'}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {filteredUsers.map((user: any) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.authorIds.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData((prev) => ({ ...prev, authorIds: [...prev.authorIds, user.id] }));
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            authorIds: prev.authorIds.filter((id) => id !== user.id),
                          }));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleCreate}
            disabled={isCreating || isUpdating}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isCreating || isUpdating ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                {editingPostId ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                ✓ {editingPostId ? 'Update Blog Post' : 'Create Blog Post'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Toast Notification */}
      {toast.isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </motion.div>
      )}
    </motion.div>
  );
}
