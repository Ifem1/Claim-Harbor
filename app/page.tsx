'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Anchor, Zap, ChevronRight } from 'lucide-react'
import { CATEGORY_LABELS } from '@/lib/genlayer/types'
import { CONTRACT_ADDRESS } from '@/lib/genlayer/client'

const CATEGORIES = Object.entries(CATEGORY_LABELS)

export default function HarborGate() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--deep-harbor)' }}>
      {!CONTRACT_ADDRESS && (
        <div
          className="text-center py-2.5 px-4 text-[11px] font-mono"
          style={{
            background: 'rgba(245, 158, 11, 0.09)',
            color: 'var(--signal-amber)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
          }}
        >
          Demo mode — set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to connect to StudioNet
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--fog-white) 1px, transparent 1px), linear-gradient(90deg, var(--fog-white) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Cyan glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(34, 211, 238, 0.05) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <div className="flex items-center justify-center gap-2">
            <span
              className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border"
              style={{ borderColor: 'rgba(34, 211, 238, 0.25)', color: 'var(--beacon-cyan)', background: 'rgba(34, 211, 238, 0.06)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--payout-mint)' }} />
              GenLayer-Native Insurance · StudioNet
            </span>
          </div>

          <div className="space-y-5">
            <h1
              className="text-5xl sm:text-6xl md:text-7xl leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)', fontWeight: 800 }}
            >
              Cover with a
              <br />
              <span style={{ color: 'var(--beacon-cyan)' }}>trustless judge.</span>
            </h1>
            <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--salt-grey)' }}>
              Buy cover in GEN. Submit evidence of loss. Let GenLayer validators judge your claim. Receive GEN only if the claim is valid.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/map">
              <button
                className="h-11 px-6 gap-2 font-semibold rounded-lg flex items-center transition-all hover:opacity-90"
                style={{ background: 'var(--beacon-cyan)', color: 'var(--ledger-ink)' }}
              >
                Enter Harbor
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/underwriter">
              <button
                className="h-11 px-6 font-semibold rounded-lg border transition-all hover:opacity-80"
                style={{ borderColor: 'var(--line)', color: 'var(--fog-white)', background: 'transparent' }}
              >
                Underwrite a Pool
              </button>
            </Link>
          </div>

          {/* Tagline row */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {[
              { icon: <Shield className="w-3.5 h-3.5" />, text: 'Buy Cover' },
              { icon: <span className="text-[10px]">→</span>, text: '' },
              { icon: <Zap className="w-3.5 h-3.5" />, text: 'Submit Evidence' },
              { icon: <span className="text-[10px]">→</span>, text: '' },
              { icon: <Anchor className="w-3.5 h-3.5" />, text: 'GenLayer Judges' },
              { icon: <span className="text-[10px]">→</span>, text: '' },
              { icon: <span className="text-xs font-mono" style={{ color: 'var(--payout-mint)' }}>GEN</span>, text: 'Receive Payout' },
            ].filter(s => s.text).map(({ icon, text }, i) => (
              <span key={i} className="flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--salt-grey)' }}>
                <span style={{ color: 'var(--beacon-cyan)' }}>{icon}</span>
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Category chips */}
      <section className="py-16 px-6 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--salt-grey)' }}>Cover Categories</p>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
              What can you protect?
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {CATEGORIES.map(([key, label]) => (
              <Link key={key} href={`/map?category=${key}`}>
                <span
                  className="text-sm font-mono px-4 py-2 rounded-full border cursor-pointer transition-all hover:opacity-80"
                  style={{ background: 'var(--dock-steel)', borderColor: 'var(--line)', color: 'var(--fog-white)' }}
                >
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--line)', background: 'var(--dock-steel)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--salt-grey)' }}>The Protocol</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
              Trustless claim settlement.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '01', color: 'var(--tide-blue)', title: 'Buy Cover', desc: 'Choose a pool. Pay a GEN premium. Your policy is live on-chain.' },
              { step: '02', color: 'var(--signal-amber)', title: 'Incident Occurs', desc: 'Something covered happens. You have a claim window to respond.' },
              { step: '03', color: 'var(--beacon-cyan)', title: 'Submit Evidence', desc: 'File your distress signal. Provide URLs, summaries, and context.' },
              { step: '04', color: 'var(--payout-mint)', title: 'GenLayer Judges', desc: 'Validators read the terms, evidence, and exclusions. A verdict is stored on-chain.' },
            ].map(({ step, color, title, desc }) => (
              <div
                key={step}
                className="rounded-xl border p-5 space-y-3 relative"
                style={{ background: 'var(--deep-harbor)', borderColor: 'var(--line)' }}
              >
                <span className="text-xs font-mono opacity-40 absolute top-4 right-4" style={{ color }}>
                  {step}
                </span>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--fog-white)', fontFamily: 'var(--font-space-grotesk)' }}>
                  {title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--salt-grey)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo pools */}
      <section className="py-20 px-6 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--salt-grey)' }}>Available Now</p>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
                Open Cover Pools
              </h2>
            </div>
            <Link href="/map" className="flex items-center gap-1 text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'var(--beacon-cyan)' }}>
              All pools <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm font-mono" style={{ color: 'var(--salt-grey)' }}>No pools yet.</p>
            <Link
              href="/underwriter"
              className="text-xs font-mono px-4 py-2 rounded-lg transition-all"
              style={{ background: 'var(--tide-blue)', color: 'var(--fog-white)' }}
            >
              Create the first pool →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-24 px-6 border-t text-center"
        style={{ borderColor: 'var(--line)', background: 'linear-gradient(to bottom, var(--dock-steel), var(--deep-harbor))' }}
      >
        <div className="max-w-xl mx-auto space-y-6">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(34, 211, 238, 0.09)', border: '1px solid rgba(34, 211, 238, 0.25)' }}
          >
            <Anchor className="w-6 h-6" style={{ color: 'var(--beacon-cyan)' }} />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fog-white)' }}>
            Drop anchor in <span style={{ color: 'var(--beacon-cyan)' }}>Claim Harbor.</span>
          </h2>
          <p style={{ color: 'var(--salt-grey)' }}>
            Your loss is real. Your claim should be too.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/map">
              <button
                className="h-12 px-8 gap-2 font-bold text-base rounded-lg flex items-center transition-all hover:opacity-90"
                style={{ background: 'var(--beacon-cyan)', color: 'var(--ledger-ink)' }}
              >
                Browse Pools
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/cabin">
              <button
                className="h-12 px-8 border font-semibold rounded-lg transition-all hover:opacity-80"
                style={{ borderColor: 'var(--line)', color: 'var(--fog-white)', background: 'transparent' }}
              >
                My Cabin
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
