import { create } from 'zustand'

interface NewsStore {
  items: string[]
  addNews: (msg: string) => void
}

export const useNewsStore = create<NewsStore>((set) => ({
  items: [
    '📈 Los mercados abren al alza tras datos de empleo positivos',
    '💱 El BCE mantiene tipos de interés sin cambios',
    '🛢️ El petróleo sube un 2% por tensiones en Oriente Medio',
    '🤖 NVIDIA bate expectativas con resultados históricos',
    '🏦 JPMorgan eleva su previsión de crecimiento para el S&P 500',
  ],
  addNews: (msg) => set(s => ({ items: [msg, ...s.items].slice(0, 30) })),
}))
