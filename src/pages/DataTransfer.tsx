import { useState, useRef } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import { analyzeImport } from '@/utils/dataTransfer'
import type { ImportPreview } from '@/utils/dataTransfer'
import { Download, Upload, FileJson, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

export default function DataTransfer() {
  const dreams = useDreamStore((s) => s.dreams)
  const importDreams = useDreamStore((s) => s.importDreams)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState('')
  const [importDone, setImportDone] = useState(false)

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(dreams, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dreamscope_export_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportDone(false)
    setParseError('')
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(raw)) {
          setParseError('JSON 文件内容不是数组格式')
          setPreview(null)
          return
        }
        const result = analyzeImport(raw, dreams)
        setPreview(result)
      } catch {
        setParseError('无法解析 JSON 文件，请检查文件格式')
        setPreview(null)
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleToggleSuspectedImport = (index: number) => {
    if (!preview) return
    const updated = [...preview.suspectedDuplicates]
    updated[index] = { ...updated[index], import: !updated[index].import }
    setPreview({ ...preview, suspectedDuplicates: updated })
  }

  const handleSelectAllSuspected = (importAll: boolean) => {
    if (!preview) return
    const updated = preview.suspectedDuplicates.map((sd) => ({ ...sd, import: importAll }))
    setPreview({ ...preview, suspectedDuplicates: updated })
  }

  const handleConfirmImport = () => {
    if (!preview) return
    const selectedSuspected = preview.suspectedDuplicates.filter((sd) => sd.import).map((sd) => sd.dream)
    const allToImport = [...preview.validDreams, ...selectedSuspected]
    if (allToImport.length === 0) return
    importDreams(allToImport)
    setImportDone(true)
    setPreview(null)
    setFileName('')
  }

  const handleCancel = () => {
    setPreview(null)
    setFileName('')
    setParseError('')
    setImportDone(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <FileJson size={28} className="text-dreamscape" />
          数据导入导出
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          将梦境记录导出为 JSON 文件备份，或从 JSON 文件导入恢复数据
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Download size={20} className="text-emerald-400" />
            <h2 className="font-display text-lg text-white">导出数据</h2>
          </div>
          <p className="text-sm text-slate-400 mb-1">
            将当前全部 <span className="text-white font-semibold">{dreams.length}</span> 条梦境记录导出为 JSON 文件
          </p>
          <p className="text-xs text-slate-500 mb-5">导出文件包含所有梦境的完整信息，可用于备份或迁移</p>
          <button
            onClick={handleExport}
            disabled={dreams.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <Download size={16} />
            导出 JSON
          </button>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Upload size={20} className="text-amber-400" />
            <h2 className="font-display text-lg text-white">导入数据</h2>
          </div>
          <p className="text-sm text-slate-400 mb-1">选择 JSON 文件导入梦境记录</p>
          <p className="text-xs text-slate-500 mb-5">导入前会预览统计信息，确认后才会写入</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-2"
          >
            <Upload size={16} />
            选择文件
          </button>
        </div>
      </div>

      {parseError && (
        <div className="glass-card p-5 mb-6 border-red-500/40">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">文件解析失败</h3>
              <p className="text-sm text-slate-400">{parseError}</p>
            </div>
          </div>
        </div>
      )}

      {importDone && (
        <div className="glass-card p-5 mb-6 border-emerald-500/40">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">导入成功</h3>
              <p className="text-sm text-slate-400">梦境记录已成功写入</p>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <FileJson size={18} className="text-dreamscape" />
              <h2 className="font-display text-lg text-white">导入预览</h2>
            </div>
            <span className="text-xs text-slate-400">{fileName}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
              <div className="text-2xl font-display text-emerald-400">{preview.newCount}</div>
              <div className="text-xs text-slate-400 mt-1">将新增</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 text-center">
              <AlertCircle size={20} className="text-orange-400 mx-auto mb-1" />
              <div className="text-2xl font-display text-orange-400">{preview.suspectedDuplicateCount}</div>
              <div className="text-xs text-slate-400 mt-1">疑似重复</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
              <AlertCircle size={20} className="text-amber-400 mx-auto mb-1" />
              <div className="text-2xl font-display text-amber-400">{preview.duplicateCount}</div>
              <div className="text-xs text-slate-400 mt-1">跳过重复</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <XCircle size={20} className="text-red-400 mx-auto mb-1" />
              <div className="text-2xl font-display text-red-400">{preview.errorCount}</div>
              <div className="text-xs text-slate-400 mt-1">格式错误</div>
            </div>
          </div>

          {preview.suspectedDuplicates.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-orange-400 flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  疑似重复记录
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelectAllSuspected(true)}
                    className="text-xs px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
                  >
                    全部导入
                  </button>
                  <button
                    onClick={() => handleSelectAllSuspected(false)}
                    className="text-xs px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-colors"
                  >
                    全部跳过
                  </button>
                </div>
              </div>
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 max-h-64 overflow-y-auto space-y-3">
                {preview.suspectedDuplicates.map((sd, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={sd.import}
                        onChange={() => handleToggleSuspectedImport(i)}
                        className="mt-1 shrink-0 rounded border-orange-500/50 text-orange-500 focus:ring-orange-500/50 bg-transparent"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-orange-400 font-medium">相似度 {(sd.similarity * 100).toFixed(0)}%</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">{sd.dream.date} {sd.dream.wakeTime}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="bg-slate-800/50 rounded-lg p-2">
                            <div className="text-slate-500 text-[10px] mb-1">导入内容</div>
                            <p className="text-slate-300 line-clamp-3">{sd.dream.text}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-lg p-2">
                            <div className="text-slate-500 text-[10px] mb-1">现有记录</div>
                            <p className="text-slate-300 line-clamp-3">{sd.existingDream.text}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {preview.errors.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                <XCircle size={14} />
                格式错误详情
              </h3>
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                {preview.errors.map((err, i) => (
                  <div key={i} className="text-xs text-slate-300 flex gap-2">
                    <span className="text-red-400 shrink-0">#{err.index}</span>
                    <span>{err.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirmImport}
              disabled={preview.newCount + preview.suspectedDuplicates.filter((sd) => sd.import).length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              <CheckCircle2 size={16} />
              确认导入 ({preview.newCount + preview.suspectedDuplicates.filter((sd) => sd.import).length} 条)
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 rounded-full text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-5">
        <h3 className="font-display text-base text-white mb-3 flex items-center gap-2">
          <AlertCircle size={16} className="text-slate-400" />
          使用说明
        </h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2">
            <span className="text-dreamscape shrink-0">•</span>
            导出的 JSON 文件包含全部梦境记录，可在不同设备间迁移数据
          </li>
          <li className="flex gap-2">
            <span className="text-dreamscape shrink-0">•</span>
            导入时会自动检测重复记录（基于 ID 匹配），重复记录将被跳过
          </li>
          <li className="flex gap-2">
            <span className="text-dreamscape shrink-0">•</span>
            系统会根据日期、醒来时间和正文相似度识别疑似重复记录，您可以选择跳过或仍然导入
          </li>
          <li className="flex gap-2">
            <span className="text-dreamscape shrink-0">•</span>
            导入前会展示预览统计，确认后才会实际写入数据
          </li>
          <li className="flex gap-2">
            <span className="text-dreamscape shrink-0">•</span>
            每条记录需包含 text、date、wakeTime、emotionScore、clarityScore、people、places、keywords 字段
          </li>
          <li className="flex gap-2">
            <span className="text-dreamscape shrink-0">•</span>
            emotionScore 和 clarityScore 需为 1-5 之间的数字，people/places/keywords 需为字符串数组
          </li>
        </ul>
      </div>
    </div>
  )
}
