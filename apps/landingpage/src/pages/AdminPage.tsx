import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trash2, Plus, FileText, Settings, Lock, BookOpen, Edit2 } from 'lucide-react';
import SEO from '../components/SEO';
import { useArticles } from '../lib/useArticles';
import { useBookChapters } from '../lib/useBookChapters';

// SHA-256 hash of 'shuidong007'
const ADMIN_PASSWORD_HASH = 'dd5fac60900c2d2d457b1ca5f3fe34cf7748004713db86474ce51004f9787ccf';

// Simple SHA-256 hashing function for the browser
async function hashPassword(password: string) {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem('socrates_admin_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginForm.username !== 'admin') {
      setLoginError('账号或密码错误');
      return;
    }

    const hashedInput = await hashPassword(loginForm.password);
    if (hashedInput === ADMIN_PASSWORD_HASH) {
      setIsAuthenticated(true);
      localStorage.setItem('socrates_admin_auth', 'true');
    } else {
      setLoginError('账号或密码错误');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('socrates_admin_auth');
    setLoginForm({ username: '', password: '' });
  };

  const { articles, addArticle, deleteArticle, isLoaded } = useArticles();
  const { chapters, updateChapter, addChapter, deleteChapter, isLoaded: isBookLoaded } = useBookChapters();
  
  const [activeTab, setActiveTab] = useState<'articles' | 'book'>('articles');
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    excerpt: string;
    category: string;
    slug: string;
    content: string;
    format: 'markdown' | 'html';
  }>({
    title: '',
    excerpt: '',
    category: '方法论',
    slug: '',
    content: '',
    format: 'markdown'
  });

  const [bookFormData, setBookFormData] = useState({
    id: '',
    title: '',
    isFree: false,
    content: '',
    order: 0
  });

  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      setMessage('请填写必填项（标题、Slug、正文）');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    addArticle(formData);
    setFormData({ title: '', excerpt: '', category: '方法论', slug: '', content: '', format: 'markdown' });
    setMessage('文章发布成功！');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.id || !bookFormData.title) {
      setMessage('请填写必填项（章节ID、标题）');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (editingChapterId) {
      updateChapter(bookFormData);
      setMessage('章节更新成功！');
    } else {
      addChapter(bookFormData);
      setMessage('新章节添加成功！');
    }
    
    setEditingChapterId(null);
    setBookFormData({ id: '', title: '', isFree: false, content: '', order: chapters.length });
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditChapter = (chapter: any) => {
    setEditingChapterId(chapter.id);
    setBookFormData(chapter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isLoaded || !isBookLoaded) return null;

  if (!isAuthenticated) {
    return (
      <>
        <SEO 
          title="管理员登录 | Socrates"
          description="Socrates 管理后台登录"
          canonical="https://socrates.socra.cn/admin"
        />
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm"
          >
            <div className="flex justify-center mb-8">
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-neutral-900" />
              </div>
            </div>
            <h1 className="text-2xl font-serif font-bold text-center text-neutral-900 mb-8">管理后台登录</h1>
            
            {loginError && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">账号</label>
                <input 
                  type="text" 
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">密码</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-neutral-900 text-white px-6 py-4 rounded-xl font-medium hover:bg-neutral-800 transition-colors"
              >
                登录
              </button>
            </form>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="文章管理后台 | Socrates"
        description="Socrates 内部文章发布与管理系统"
        canonical="https://socrates.socra.cn/admin"
      />
      
      <div className="py-12 md:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-neutral-900" />
            <h1 className="font-serif text-3xl font-bold text-neutral-900">
              Socrates 管理后台
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            退出登录
          </button>
        </div>

        <div className="flex gap-6 mb-8 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('articles')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'articles' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            文章管理
          </button>
          <button
            onClick={() => setActiveTab('book')}
            className={`pb-4 px-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'book' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            书籍内容管理
          </button>
        </div>

        {message && (
          <div className="mb-8 p-4 bg-neutral-900 text-white rounded-xl text-center font-medium">
            {message}
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> 发布新文章
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">文章标题 *</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                      placeholder="例如：为什么大多数错题本都是死书"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">分类 *</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all bg-white"
                      >
                        <option value="方法论">方法论</option>
                        <option value="产品动态">产品动态</option>
                        <option value="用户故事">用户故事</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">正文格式 *</label>
                      <select 
                        value={formData.format}
                        onChange={(e) => setFormData({...formData, format: e.target.value as 'markdown' | 'html'})}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all bg-white"
                      >
                        <option value="markdown">Markdown</option>
                        <option value="html">HTML</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">URL Slug (英文路径) *</label>
                      <input 
                        type="text" 
                        value={formData.slug}
                        onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                        placeholder="例如：why-mistake-books-fail"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">摘要 (用于列表展示)</label>
                    <textarea 
                      value={formData.excerpt}
                      onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all h-24 resize-none"
                      placeholder="简短的一段话总结文章核心观点..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-medium text-neutral-700">正文内容 *</label>
                      <span className="text-xs text-neutral-500">
                        {formData.format === 'markdown' ? '使用 ## 表示二级标题，- 表示列表' : '支持直接粘贴 HTML 代码'}
                      </span>
                    </div>
                    <textarea 
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all h-64 font-mono text-sm"
                      placeholder={formData.format === 'markdown' ? "在此输入 Markdown 格式的正文..." : "在此粘贴排版好的 HTML 代码..."}
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-neutral-900 text-white px-6 py-4 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> 确认发布
                  </button>
                </form>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5" /> 已发布文章
                </h2>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <motion.div 
                      key={article.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white p-4 rounded-xl border border-neutral-200 flex justify-between items-start gap-4 group"
                    >
                      <div>
                        <h3 className="font-medium text-neutral-900 text-sm mb-1 line-clamp-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <span>{article.date}</span>
                          <span>•</span>
                          <span>{article.category}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          deleteArticle(article.id);
                          setMessage('文章已删除');
                          setTimeout(() => setMessage(''), 3000);
                        }}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50 shrink-0"
                        title="删除文章"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  {articles.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-8">暂无文章</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'book' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Book Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    {editingChapterId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingChapterId ? '编辑章节' : '添加新章节'}
                  </h2>
                  {editingChapterId && (
                    <button 
                      onClick={() => {
                        setEditingChapterId(null);
                        setBookFormData({ id: '', title: '', isFree: false, content: '', order: chapters.length });
                      }}
                      className="text-sm text-neutral-500 hover:text-neutral-900"
                    >
                      取消编辑
                    </button>
                  )}
                </div>
                <form onSubmit={handleBookSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">章节 ID (英文/数字) *</label>
                      <input 
                        type="text" 
                        value={bookFormData.id}
                        onChange={(e) => setBookFormData({...bookFormData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                        placeholder="例如：ch1"
                        disabled={!!editingChapterId}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">排序序号</label>
                      <input 
                        type="number" 
                        value={bookFormData.order}
                        onChange={(e) => setBookFormData({...bookFormData, order: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">章节标题 *</label>
                    <input 
                      type="text" 
                      value={bookFormData.title}
                      onChange={(e) => setBookFormData({...bookFormData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
                      placeholder="例如：第一章：重新认识错题"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <input 
                      type="checkbox" 
                      id="isFree"
                      checked={bookFormData.isFree}
                      onChange={(e) => setBookFormData({...bookFormData, isFree: e.target.checked})}
                      className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <label htmlFor="isFree" className="text-sm font-medium text-neutral-900 cursor-pointer">
                      设为免费试读章节
                    </label>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-medium text-neutral-700">章节正文 (支持直接粘贴 HTML 代码)</label>
                      <span className="text-xs text-neutral-500">例如：&lt;p&gt;段落内容&lt;/p&gt;</span>
                    </div>
                    <textarea 
                      value={bookFormData.content}
                      onChange={(e) => setBookFormData({...bookFormData, content: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all h-80 font-mono text-sm"
                      placeholder="在此直接粘贴排版好的 HTML 代码..."
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-neutral-900 text-white px-6 py-4 rounded-xl font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                  >
                    {editingChapterId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />} 
                    {editingChapterId ? '保存修改' : '添加章节'}
                  </button>
                </form>
              </div>
            </div>

            {/* Book List Section */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 sm:p-8">
                <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> 书籍目录
                </h2>
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <motion.div 
                      key={chapter.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white p-4 rounded-xl border transition-colors flex justify-between items-start gap-3 group cursor-pointer ${editingChapterId === chapter.id ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400'}`}
                      onClick={() => handleEditChapter(chapter)}
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">#{chapter.order}</span>
                          {chapter.isFree && <span className="text-[10px] font-medium px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-nowrap">试读</span>}
                        </div>
                        <h3 className="font-medium text-neutral-900 text-sm line-clamp-2">
                          {chapter.title}
                        </h3>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChapter(chapter.id);
                          if (editingChapterId === chapter.id) {
                            setEditingChapterId(null);
                            setBookFormData({ id: '', title: '', isFree: false, content: '', order: chapters.length });
                          }
                          setMessage('章节已删除');
                          setTimeout(() => setMessage(''), 3000);
                        }}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 shrink-0"
                        title="删除章节"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                  {chapters.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-8">暂无章节</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
