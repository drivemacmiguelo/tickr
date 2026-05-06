'use client'
import { useGameStore } from '@/lib/store'
import { useInboxStore } from '@/lib/inboxStore'
import { TrendingUp, Dices, Twitter, User, MoreHorizontal, Mail } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const MAIN_TABS = [
  { id: 'market',  icon: TrendingUp, label: 'Bolsa'   },
  { id: 'casino',  icon: Dices,      label: 'Casino'  },
  { id: 'inbox',   icon: Mail,       label: 'Mensajes'},
  { id: 'jaippy',  icon: Twitter,    label: 'Jaippy'  },
  { id: 'profile', icon: User,       label: 'Perfil'  },
]

const MORE_TABS = [
  { id: 'forex',           label: 'Forex'          },
  { id: 'lifestyle',       label: 'Lifestyle'      },
  { id: 'farm',            label: 'Farmear'        },
  { id: 'shop',            label: 'Tienda'         },
  { id: 'blackmarket',     label: 'M. Negro'       },
  { id: 'rivals',          label: 'Rivales'        },
  { id: 'sports',          label: 'Deportes'       },
  { id: 'algo',            label: 'AlgoTrading'    },
  { id: 'empresa',         label: 'Empresa'        },
  { id: 'coleccionables',  label: 'Coleccionables' },
  { id: 'subastas',        label: 'Subastas'       },
]

export default function BottomNav() {
  const { activeTab, setTab } = useGameStore()
  const [showMore, setShowMore] = useState(false)
  const isMoreActive = MORE_TABS.some(t => t.id === activeTab)
  const inboxUnread = useInboxStore(s => s.unreadCount)

  return (
    <>
      {/* More drawer overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More drawer */}
      <div className={clsx(
        'fixed bottom-0 left-0 right-0 z-50 bg-bg2 border-t border-white/10 rounded-t-2xl transition-transform duration-300',
        showMore ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="w-9 h-1 bg-white/20 rounded mx-auto mt-3 mb-4" />
        <div className="px-4 pb-8 grid grid-cols-4 gap-3">
          {MORE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setTab(tab.id); setShowMore(false) }}
              className={clsx(
                'flex flex-col items-center gap-1.5 py-3 rounded-xl text-[10px] font-medium border transition-all',
                activeTab === tab.id
                  ? 'bg-blue/10 border-blue/40 text-blue'
                  : 'bg-bg3 border-white/5 text-muted'
              )}
            >
              <span className="text-base">
                {tab.id === 'forex'        ? '💱' :
                 tab.id === 'lifestyle'    ? '🏠' :
                 tab.id === 'farm'         ? '⚡' :
                 tab.id === 'shop'         ? '🛒' :
                 tab.id === 'blackmarket'  ? '🕶️' :
                 tab.id === 'rivals'       ? '🏆' :
                 tab.id === 'sports'       ? '⚽' :
                 tab.id === 'algo'         ? '🤖' :
                 tab.id === 'empresa'      ? '🏢' :
                 tab.id === 'subastas'     ? '🔨' :
                                            '🃏'}
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main bottom nav */}
      <nav className="flex-shrink-0 flex items-center justify-around bg-bg2 border-t border-white/5 bottom-nav px-2 pt-2">
        {MAIN_TABS.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex flex-col items-center gap-1 min-w-[44px] pb-1"
            >
              <div className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all relative',
                active ? 'bg-blue/15' : ''
              )}>
                <Icon size={20} className={active ? 'text-blue' : 'text-muted'} />
                {id === 'inbox' && inboxUnread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
                    style={{ background: '#f87171' }}>{inboxUnread > 9 ? '9+' : inboxUnread}</span>
                )}
              </div>
              <span className={clsx('text-[9px] font-medium', active ? 'text-white' : 'text-muted')}>
                {label}
              </span>
            </button>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(v => !v)}
          className="flex flex-col items-center gap-1 min-w-[44px] pb-1"
        >
          <div className={clsx(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-all relative',
            isMoreActive ? 'bg-blue/15' : ''
          )}>
            <MoreHorizontal size={20} className={isMoreActive ? 'text-blue' : 'text-muted'} />
            {isMoreActive && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue border-2 border-bg2" />
            )}
          </div>
          <span className={clsx('text-[9px] font-medium', isMoreActive ? 'text-white' : 'text-muted')}>
            Más
          </span>
        </button>
      </nav>
    </>
  )
}
