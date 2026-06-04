import { useState } from 'react'
import { useDreamStore } from '@/store/dreamStore'
import type { Backup } from '@/types/dream'
import { HardDrive, Plus, Trash2, RotateCcw, Clock, FileText, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

interface ConfirmDialog {
  type: 'restore' | 'delete'
  backup: Backup
}

export default function BackupCenter() {
  const dreams = useDreamStore((s) => s.dreams)
  const backups = useDreamStore((s) => s.backups)
  const createBackup = useDreamStore((s) => s.createBackup)
  const deleteBackup = useDreamStore((s) => s.deleteBackup)
  const restoreBackup = useDreamStore((s) => s.restoreBackup)

  const [backupName, setBackupName] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null)
  const [restoreSuccess, setRestoreSuccess] = useState(false)

  function formatDate(isoString: string): string {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function handleCreateBackup() {
    const name = backupName.trim()
    if (!name) return
    createBackup(name)
    setBackupName('')
  }

  function handleRestore() {
    if (!confirmDialog) return
    restoreBackup(confirmDialog.backup.id)
    setConfirmDialog(null)
    setRestoreSuccess(true)
    setTimeout(() => setRestoreSuccess(false), 3000)
  }

  function handleDelete() {
    if (!confirmDialog) return
    deleteBackup(confirmDialog.backup.id)
    setConfirmDialog(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-white flex items-center gap-3">
          <HardDrive size={28} className="text-dreamscape" />
          本地备份与恢复中心
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          创建命名备份，随时恢复到历史版本。备份独立存储于本地浏览器
        </p>
      </div>

      {restoreSuccess && (
        <div className="glass-card p-5 mb-6 border-emerald-500/40">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">恢复成功</h3>
              <p className="text-sm text-slate-400">所有数据已恢复，仪表盘和记录列表已自动刷新</p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={20} className="text-dreamscape" />
          <h2 className="font-display text-lg text-white">创建新备份</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          当前共有 <span className="text-white font-semibold">{dreams.length}</span> 条梦境记录将被备份
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            placeholder="输入备份名称，例如：2026年6月完整数据"
            className="flex-1 glow-input px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateBackup()
            }}
          />
          <button
            onClick={handleCreateBackup}
            disabled={!backupName.trim() || dreams.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            <Plus size={16} />
            创建备份
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="font-display text-lg text-white flex items-center gap-2">
          <FileText size={18} className="text-slate-400" />
          备份列表
          <span className="text-sm font-normal text-slate-500 ml-2">({backups.length})</span>
        </h2>
      </div>

      {backups.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">💾</div>
          <h3 className="font-display text-lg text-white mb-2">还没有任何备份</h3>
          <p className="text-sm text-slate-400">
            建议在重要操作前创建备份，防止数据意外丢失
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="glass-card p-5 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-display text-base text-white mb-1">
                  {backup.name}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(backup.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {backup.dreamCount} 条记录
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmDialog({ type: 'restore', backup })}
                  className="px-4 py-2 rounded-full text-sm bg-dreamscape/20 text-dreamscape hover:bg-dreamscape/30 transition-colors flex items-center gap-1.5"
                  title="恢复此备份"
                >
                  <RotateCcw size={14} />
                  恢复
                </button>
                <button
                  onClick={() => setConfirmDialog({ type: 'delete', backup })}
                  className="px-4 py-2 rounded-full text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1.5"
                  title="删除此备份"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDialog && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setConfirmDialog(null)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 max-w-md w-full border border-dreamscape/30 shadow-2xl shadow-dreamscape/20">
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  confirmDialog.type === 'restore'
                    ? 'bg-amber-500/20'
                    : 'bg-red-500/20'
                }`}>
                  {confirmDialog.type === 'restore' ? (
                    <RotateCcw size={20} className="text-amber-400" />
                  ) : (
                    <Trash2 size={20} className="text-red-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-display text-lg text-white mb-1">
                    {confirmDialog.type === 'restore' ? '确认恢复备份' : '确认删除备份'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    "{confirmDialog.backup.name}"
                  </p>
                </div>
              </div>

              {confirmDialog.type === 'restore' ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-300 font-medium mb-1">此操作将覆盖当前所有数据</p>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        恢复后，当前的 {dreams.length} 条梦境记录将被替换为备份中的 {confirmDialog.backup.dreamCount} 条记录。
                        所有仪表盘图表、侧边栏和标签建议将立即使用恢复后的数据。
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-red-300 font-medium mb-1">此操作不可撤销</p>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        删除后将无法恢复此备份，但不会影响当前的梦境记录。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-5 py-2.5 rounded-full text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  取消
                </button>
                <button
                  onClick={confirmDialog.type === 'restore' ? handleRestore : handleDelete}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    confirmDialog.type === 'restore'
                      ? 'bg-amber-500 hover:bg-amber-400 text-white'
                      : 'bg-red-500 hover:bg-red-400 text-white'
                  }`}
                >
                  {confirmDialog.type === 'restore' ? (
                    <>
                      <CheckCircle2 size={14} />
                      确认恢复
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      确认删除
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
