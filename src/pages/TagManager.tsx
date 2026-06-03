import { useState, useMemo } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { Tags, User, MapPin, Tag, Edit2, Check, X, Search } from 'lucide-react'

interface EditingState {
  type: 'people' | 'places' | 'keywords' | null
  name: string
  newValue: string
}

const emptyEditing: EditingState = {
  type: null,
  name: '',
  newValue: '',
}

export default function TagManager() {
  const getAllTags = useDreamStore((s) => s.getAllTags)
  const renameTag = useDreamStore((s) => s.renameTag)

  const allTags = useMemo(() => getAllTags(), [getAllTags])
  const [searchText, setSearchText] = useState('')
  const [editing, setEditing] = useState<EditingState>(emptyEditing)

  const totalCount = allTags.people.length + allTags.places.length + allTags.keywords.length
  const totalUsage =
    allTags.people.reduce((sum, t) => sum + t.count, 0) +
    allTags.places.reduce((sum, t) => sum + t.count, 0) +
    allTags.keywords.reduce((sum, t) => sum + t.count, 0)

  const filterTags = <T extends { name: string }>(tags: T[]): T[] => {
    if (!searchText.trim()) return tags
    const query = searchText.toLowerCase()
    return tags.filter((t) => t.name.toLowerCase().includes(query))
  }

  const filteredPeople = filterTags(allTags.people)
  const filteredPlaces = filterTags(allTags.places)
  const filteredKeywords = filterTags(allTags.keywords)

  const startEditing = (type: 'people' | 'places' | 'keywords', name: string) => {
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

  const isEditing = (type: 'people' | 'places' | 'keywords', name: string) =>
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
    type: 'people' | 'places' | 'keywords'
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
