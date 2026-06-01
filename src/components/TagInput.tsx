import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
}

export default function TagInput({ label, tags, onChange, suggestions, placeholder }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag(value: string) {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const filteredSuggestions = suggestions?.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase())
  )

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="glow-input px-3 py-2 min-h-[44px] flex flex-wrap gap-2 items-center cursor-text" onClick={() => document.getElementById(`tag-input-${label}`)?.focus()}>
        {tags.map((tag) => (
          <span key={tag} className="capsule-tag capsule-tag-default">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-1 hover:text-white"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={`tag-input-${label}`}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="bg-transparent border-none outline-none text-sm text-slate-200 flex-1 min-w-[80px] placeholder:text-slate-500"
        />
      </div>
      {filteredSuggestions && filteredSuggestions.length > 0 && input.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="capsule-tag capsule-tag-default text-xs"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
