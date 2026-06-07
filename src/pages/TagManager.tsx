import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDreamStore } from '@/store/dreamStore'
import { Tags, User, MapPin, Tag, Edit2, Check, X, Search, ChevronDown, ChevronUp, Eye, AlertTriangle } from 'lucide-react'
import {
  getAllTags,
  buildLowFreqTags,
  filterTagsByName,
  getTotalTagCount,
  getTotalTagUsage,
  getLowFreqTagCount,
  type TagType,
} from '@/domain/tagStats'

interface EditingState {
  type: TagType | null
  name: string
  newValue: string
}

const emptyEditing: EditingState = {
  type: null,
  name: '',
  newValue: '',
}

export default function TagManager() {
  const dreams = useDreamStore((s) => s.dreams)
  const renameTag = useDreamStore((s) => s.renameTag)

  const allTags = useMemo(() => getAllTags(dreams), [dreams])
  const [searchText, setSearchText] = useState('')
  const [editing, setEditing] = useState<EditingState>(emptyEditing)
  const [lowFreqExpanded, setLowFreqExpanded] = useState(false)
  const [lowFreqType, setLowFreqType] = useState<TagType>('people')
  const navigate = useNavigate()

  const lowFreqTags = useMemo(() => buildLowFreqTags(dreams, allTags, 2), [allTags, dreams])

  const lowFreqTotal = getLowFreqTagCount(lowFreqTags)
  const totalCount = getTotalTagCount(allTags)
  const totalUsage = getTotalTagUsage(allTags)

  const filteredPeople = filterTagsByName(allTags.people, searchText)
  const filteredPlaces = filterTagsByName(allTags.places, searchText)
  const filteredKeywords = filterTagsByName(allTags.keywords, searchText)

  const startEditing = (type: TagType, name: string) => {
    setEditing({ type, name, newValue: name })
  }

  const cancelEditing = () => {
    setEditing(emptyEditing)
  }

  const confirmRename = () => {
    if (!editing.type || !editing.name || !editing.newValue.trim()) return
    renameTag(editing.type, editing.name, editing.newValue)
    setEditing(emptyEditing)
  }

  const isEditing = (type: TagType, name: string) =>
    editing.type === type && editing.name === name

  const TagSection = ({
    title,
    icon: Icon,
    type,
    tags,
    color,
  }: {
    title: string
    icon: typeof User
    type: TagType
    tags: { name: string; count: number }[]
    color: string
  }) => (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className={color} />
        <h2 className="font-display text-lg text-white">{title}</h2>
        <span className="text-xs text-slate-400 ml-auto">{tags.length} 个标签</span>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          {searchText ? '没有匹配的标签' : '暂无标签'}
        </div>
      ) : (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.name}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
            >
              {isEditing(type, tag.name) ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editing.newValue}
                    onChange={(e) => setEditing({ ...editing, newValue: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmRename()
                      if (e.key === 'Escape') cancelEditing()
                    }}
                    autoFocus
                    className="glow-input flex-1 px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={confirmRename}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400 hover:bg-emerald-400/20 transition-colors"
                    title="确认"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors"
                    title="取消"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-200 truncate">{tag.name}</span>
                  <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-md shrink-0">
                    {tag.count} 次
                  </span>
                  <button
                    onClick={() => startEditing(type, tag.name)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-dreamscape hover:bg-dreamscape/20 transition-colors opacity-0 group-hover:opacity-100"
                    title="重命名"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <Tags size={28} className="text-dreamscape" />
          标签管理
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          统一管理所有梦境中的人物、地点和关键词标签，重命名后会自动更新所有相关梦境记录
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-display text-dreamscape">{totalCount}</div>
          <div className="text-xs text-slate-400 mt-1">标签总数</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-display text-nebula">{totalUsage}</div>
          <div className="text-xs text-slate-400 mt-1">累计使用次数</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-3xl font-display text-starlight">{allTags.people.length}</div>
          <div className="text-xs text-slate-400 mt-1">人物标签</div>
        </div>
        <div
          className={`glass-card p-4 text-center cursor-pointer transition-all ${
            lowFreqTotal > 0
              ? 'hover:bg-white/10 border border-amber-500/30'
              : 'opacity-50'
          }`}
          onClick={() => lowFreqTotal > 0 && setLowFreqExpanded(!lowFreqExpanded)}
        >
          <div className="text-3xl font-display text-amber-400">{lowFreqTotal}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
            <AlertTriangle size={12} />
            低频标签
          </div>
        </div>
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索标签名称..."
            className="glow-input flex-1 px-3 py-2 text-sm bg-transparent border-none focus:ring-0"
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {lowFreqTotal > 0 && (
        <div className="glass-card mb-6 overflow-hidden border border-amber-500/20">
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            onClick={() => setLowFreqExpanded(!lowFreqExpanded)}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-amber-400" />
              <span className="font-display text-base text-white">低频标签</span>
              <span className="text-xs text-slate-400">
                出现 1-2 次的标签，点击查看相关梦境
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-amber-400 font-medium">{lowFreqTotal}</span>
              {lowFreqExpanded ? (
                <ChevronUp size={18} className="text-slate-400" />
              ) : (
                <ChevronDown size={18} className="text-slate-400" />
              )}
            </div>
          </button>

          {lowFreqExpanded && (
            <div className="px-4 pb-4">
              <div className="flex gap-2 mb-4">
                {([
                  { key: 'people' as const, label: '人物', icon: User, color: 'text-rose-400', count: lowFreqTags.people.length },
                  { key: 'places' as const, label: '地点', icon: MapPin, color: 'text-emerald-400', count: lowFreqTags.places.length },
                  { key: 'keywords' as const, label: '关键词', icon: Tag, color: 'text-amber-400', count: lowFreqTags.keywords.length },
                ]).map(({ key, label, icon: Icon, color, count }) => (
                  <button
                    key={key}
                    onClick={() => setLowFreqType(key)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      lowFreqType === key
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-white/5 text-slate-500 border border-transparent hover:text-slate-300'
                    }`}
                  >
                    <Icon size={14} className={color} />
                    {label}
                    {count > 0 && (
                      <span className="text-[10px] opacity-60">({count})</span>
                    )}
                  </button>
                ))}
              </div>

              {lowFreqTags[lowFreqType].length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  该类别没有低频标签
                </div>
              ) : (
                <div className="space-y-2">
                  {lowFreqTags[lowFreqType].map((tag) => (
                    <div
                      key={tag.name}
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/8 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-200">{tag.name}</span>
                          <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded">
                            {tag.count} 次
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {tag.dreams.map((dream) => (
                          <div
                            key={dream.id}
                            onClick={() => navigate(`/dream/${dream.id}`)}
                            className="flex items-center gap-2 p-2 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                          >
                            <span className="text-xs text-slate-400 shrink-0">{dream.date}</span>
                            <p className="text-xs text-slate-300 line-clamp-1 flex-1 group-hover:text-white transition-colors">
                              {dream.text}
                            </p>
                            <Eye size={12} className="text-slate-500 group-hover:text-dreamscape transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TagSection
          title="人物"
          icon={User}
          type="people"
          tags={filteredPeople}
          color="text-rose-400"
        />
        <TagSection
          title="地点"
          icon={MapPin}
          type="places"
          tags={filteredPlaces}
          color="text-emerald-400"
        />
        <TagSection
          title="关键词"
          icon={Tag}
          type="keywords"
          tags={filteredKeywords}
          color="text-amber-400"
        />
      </div>
    </div>
  )
}
