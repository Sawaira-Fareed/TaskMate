import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Star, Wrench, Plug, ShoppingBag, Monitor, MapPin, CheckCircle, Award } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const serviceTypes = [
  { id: 'all', icon: Search, label: 'All', labelUr: 'تمام' },
  { id: 'plumber', icon: Wrench, label: 'Plumber', labelUr: 'پلمبر' },
  { id: 'electrician', icon: Plug, label: 'Electrician', labelUr: 'الیکٹریشن' },
  { id: 'grocery', icon: ShoppingBag, label: 'Grocery', labelUr: 'گروسری' },
  { id: 'computer_repair', icon: Monitor, label: 'Computer', labelUr: 'کمپیوٹر' },
]

export default function ProviderList() {
  const navigate = useNavigate()
  const [lang, setLang] = useState(localStorage.getItem('zaria-language') || 'en')
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const t = (en, ur) => (lang === 'ur' ? ur : en)

  useEffect(() => {
    async function load() {
      setLoading(true)
      let query = supabase
        .from('providers')
        .select('*, user:user_id(id, full_name, avatar_url, city)')
        .eq('is_approved', true)
        .eq('is_blocked', false)
        .order('plan', { ascending: false })
        .order('avg_rating', { ascending: false })

      if (activeFilter !== 'all') {
        query = query.contains('service_types', [activeFilter])
      }

      const { data } = await query.limit(50)
      setProviders(data || [])
      setLoading(false)
    }
    load()
  }, [activeFilter])

  const filtered = searchQuery
    ? providers.filter(p =>
        p.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.service_types?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : providers

  const serviceColors = {
    plumber: 'from-blue-400 to-cyan-300',
    electrician: 'from-amber-400 to-orange-300',
    grocery: 'from-emerald-400 to-teal-300',
    computer_repair: 'from-fuchsia-400 to-pink-300',
  }

  const serviceIcons = {
    plumber: Wrench,
    electrician: Plug,
    grocery: ShoppingBag,
    computer_repair: Monitor,
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center gap-3 sticky top-0 z-30">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Find Providers', 'پرووائیڈرز تلاش کریں')}</h1>
      </header>

      <div className="bg-white dark:bg-gray-900 px-4 pb-3 pt-1">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('Search providers...', 'پرووائیڈرز تلاش کریں...')} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 border-none focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
      </div>

<div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 pb-3">
  <div className="flex flex-wrap gap-2">
          {serviceTypes.map(s => (
            <button key={s.id} onClick={() => setActiveFilter(s.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeFilter === s.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <s.icon className="w-4 h-4" /> {lang === 'ur' ? s.labelUr : s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('No providers found', 'کوئی پرووائیڈر نہیں ملا')}</p>
          </div>
        ) : (
          filtered.map(p => {
            const mainService = p.service_types?.[0] || 'plumber'
            const ServiceIcon = serviceIcons[mainService] || Wrench
            const gradient = serviceColors[mainService] || 'from-purple-500 to-pink-500'

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/customer/provider/${p.id}`)}
             className="relative bg-[#f5f0ff] dark:bg-gray-800 rounded-2xl shadow-sm border border-purple-100/40 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer active:scale-[0.98]">

        <div className="absolute top-0 right-0 w-[28%] h-full rounded-2xl overflow-hidden" style={{ clipPath: 'polygon(35% 0, 100% 0, 100% 100%, 0% 100%)' }}>
  <div className={`w-full h-full bg-gradient-to-br ${gradient} opacity-100 dark:opacity-70`} />
</div>

                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      {p.user?.avatar_url ? (
                        <img src={p.user.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-gray-100 dark:border-gray-700" />
                      ) : (
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                          <ServiceIcon className="w-7 h-7 text-white" />
                        </div>
                      )}
                      {p.plan === 'pro' && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                          <Award className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.user?.full_name || 'Provider'}</h3>
                        {p.plan === 'pro' && (
                          <span className="text-xs px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full font-medium">PRO</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-2">{p.service_types?.join(' • ')}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{p.avg_rating || '--'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{p.total_jobs || 0} {t('jobs', 'کام')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{p.user?.city || 'Jand'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                 <div className="flex gap-2 mt-4 pt-3 border-t border-purple-100/60 dark:border-gray-700">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/customer/provider/${p.id}`) }} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition-colors">
                      {t('View Profile', 'پروفائل دیکھیں')}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}