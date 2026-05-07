'use client'
import { useState } from 'react'
import { useGameStore, fmtN, getLv } from '@/lib/store'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import clsx from 'clsx'

interface Post {
  id: string; name: string; handle: string; emoji: string; text: string
  ts: number; likes: number; liked: boolean; isMe?: boolean
}

const NPC_POSTS: Omit<Post, 'id' | 'ts' | 'liked'>[] = [
  { name: 'María García',    handle: '@mgarcia_inv',  emoji: '👩‍💼', likes: 42,  text: 'El mercado está en máximos históricos. ¿Alguien más acumulando liquidez? 🤔' },
  { name: 'Carlos Ruiz',     handle: '@quant_carlos', emoji: '👨‍💻', likes: 88,  text: 'Mi algoritmo lleva 47 operaciones ganadoras seguidas. El backtesting no miente 📊' },
  { name: 'Priya Kapoor',    handle: '@priya_degen',  emoji: '👩‍💻', likes: 213, text: 'WAGMI. Si no estás en crypto en 2024 te vas a arrepentir. 🚀🚀🚀' },
  { name: 'Viktor Kozlov',   handle: '@v_kozlov',     emoji: '🧔',  likes: 15,  text: 'El petróleo siempre gana. Siempre.' },
  { name: 'Ibrahim Al-Saud', handle: '@ibrahim_sf',   emoji: '👳',  likes: 7,   text: 'Largo plazo. Paciencia. Eso es todo.' },
  { name: 'Min-jun Lee',     handle: '@minjun_vc',    emoji: '👨‍🔬', likes: 156, text: '10x o nada. Así piensan los mejores inversores del mundo. El resto... mediocres.' },
  { name: 'Yuki Tanaka',     handle: '@yuki_trades',  emoji: '👩‍🔬', likes: 94,  text: 'Ganando 速い！El mercado japonés hoy +3.2%. Buen día 📈' },
  { name: 'Benoit Lefèvre',  handle: '@benoit_hf',    emoji: '🧑‍💼', likes: 31,  text: 'París siempre ha sido el centro financiero real de Europa. Don\'t @ me.' },
]

// ─── PERSISTENT JAIPPY STORE ───────────────────────────────────
interface JaippyStore {
  posts: Post[]
  draft: string
  setPosts: (posts: Post[]) => void
  setDraft: (draft: string) => void
}

const useJaippyStore = create<JaippyStore>()(persist((set) => ({
  posts: NPC_POSTS.sort(() => Math.random() - 0.5).map((p, i) => ({
    ...p, id: 'npc_' + i, ts: Date.now() - Math.random() * 3600000 * 5, liked: false
  })),
  draft: '',
  setPosts: (posts) => set({ posts }),
  setDraft: (draft) => set({ draft }),
}), { name: 'tickr-jaippy-state' }))


export default function JaippyTab() {
  const { lv, getTotalWealth, rivals } = useGameStore()
  const { posts, draft, setPosts, setDraft } = useJaippyStore()
  // Use draft from persistent store so it survives tab changes
  const newPost = draft
  const setNewPost = setDraft
  const [tab, setTab] = useState<'feed' | 'perfil'>('feed')
  const myWealth = getTotalWealth()
  const myHandle = '@player'

  function submitPost() {
    if (!newPost.trim()) return
    const post: Post = {
      id: 'me_' + Date.now(), name: 'Tú', handle: myHandle, emoji: '😎',
      text: newPost.trim(), ts: Date.now(), likes: 0, liked: false, isMe: true
    }
    setPosts([post, ...posts])
    setNewPost('')
  }

  function toggleLike(id: string) {
    setPosts(posts.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
  }

  function flexPost(template: string) {
    setNewPost(template)
  }

  const FLEX_TEMPLATES = [
    `Acabo de alcanzar ${fmtN(myWealth)}€ de patrimonio 💰 No paren los mercados`,
    `Nivel ${lv} alcanzado. Para los que dudaron: os lo dije 😂`,
    `Otro día más siendo el mejor trader de Tickr 📈`,
  ]

  return (
    <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-white/5">
        {(['feed', 'perfil'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('flex-1 py-2.5 text-xs font-medium capitalize',
              tab === t ? 'text-white border-b-2 border-blue' : 'text-muted')}>
            {t === 'feed' ? '🐦 Feed' : '👤 Tu perfil'}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Post composer */}
          <div className="flex-shrink-0 p-3 border-b border-white/5 flex flex-col gap-2">
            <textarea
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              placeholder="¿Qué está pasando en los mercados?"
              rows={2}
              className="w-full bg-bg3 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-blue/30 resize-none"
            />
            {/* Flex templates */}
            <div className="flex gap-1.5 overflow-x-auto">
              {FLEX_TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => flexPost(t)}
                  className="flex-shrink-0 text-[9px] px-2 py-1 rounded-full bg-amber/10 text-amber border border-amber/20 hover:bg-amber/15">
                  💪 Flex {i + 1}
                </button>
              ))}
            </div>
            <button onClick={submitPost} disabled={!newPost.trim()}
              className="self-end px-4 py-1.5 rounded-full bg-blue text-white text-xs font-bold disabled:opacity-30 hover:opacity-90">
              Postear
            </button>
          </div>

          {/* Posts */}
          {posts.map(post => (
            <div key={post.id} className={clsx('flex gap-3 px-4 py-3 border-b border-white/5 hover:bg-bg3 transition-colors', post.isMe && 'bg-blue/3')}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-bg3 border border-white/8">
                {post.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white">{post.name}</span>
                  <span className="text-[9px] text-muted">{post.handle}</span>
                  <span className="text-[9px] text-muted ml-auto">
                    {Math.round((Date.now() - post.ts) / 60000)}m
                  </span>
                </div>
                <div className="text-xs text-muted leading-relaxed">{post.text}</div>
                <button onClick={() => toggleLike(post.id)}
                  className={clsx('mt-1.5 flex items-center gap-1 text-[10px] transition-colors',
                    post.liked ? 'text-red' : 'text-muted hover:text-red')}>
                  {post.liked ? '❤️' : '🤍'} {post.likes}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'perfil' && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-blue/15 border-2 border-blue/30 flex items-center justify-center text-3xl">😎</div>
            <div>
              <div className="text-sm font-bold text-white">Tú</div>
              <div className="text-xs text-muted">{myHandle}</div>
              <div className="text-xs text-amber">{fmtN(myWealth)}€ patrimonio</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="card p-2"><div className="text-sm font-bold text-white">{posts.filter(p => p.isMe).length}</div><div className="text-[9px] text-muted">Posts</div></div>
            <div className="card p-2"><div className="text-sm font-bold text-blue">{lv}</div><div className="text-[9px] text-muted">Nivel</div></div>
            <div className="card p-2"><div className="text-sm font-bold text-green">{rivals.filter((r: any) => r.bal < myWealth).length}</div><div className="text-[9px] text-muted">Superados</div></div>
          </div>
          <div className="flex flex-col gap-2">
            {posts.filter(p => p.isMe).map(post => (
              <div key={post.id} className="card p-3">
                <div className="text-xs text-muted">{post.text}</div>
                <div className="text-[9px] text-muted mt-1">❤️ {post.likes}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
