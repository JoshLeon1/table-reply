'use client'

/**
 * Dynamic-import wrappers for recharts to keep it out of the initial
 * Analytics bundle. Recharts ships ~90kB gzipped; lazy-loading cuts
 * the Analytics page's first-load JS substantially.
 *
 * All components are rendered client-side only (ssr: false) because
 * recharts relies on ResponsiveContainer measuring DOM layout.
 */

import dynamic from 'next/dynamic'

export const LineChart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })
export const Line = dynamic(() => import('recharts').then(m => m.Line), { ssr: false })
export const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false })
export const YAxis = dynamic(() => import('recharts').then(m => m.YAxis), { ssr: false })
export const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false })
export const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false })
export const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false })
export const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false })
export const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false })
export const Bar = dynamic(() => import('recharts').then(m => m.Bar), { ssr: false })
export const Cell = dynamic(() => import('recharts').then(m => m.Cell), { ssr: false })
export const ComposedChart = dynamic(() => import('recharts').then(m => m.ComposedChart), { ssr: false })
