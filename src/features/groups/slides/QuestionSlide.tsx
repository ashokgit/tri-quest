import { AnimatePresence, motion } from 'motion/react'
import type { Session } from '@/data/schema'
import { Lozenge, Rail } from '@/features/presenter/components/Lozenge'
import { NietQuestEmblem } from '@/features/presenter/components/NietQuestEmblem'
import { TimerRing } from '@/features/presenter/components/TimerRing'
import { useTimeLeft } from '@/features/presenter/components/useTimeLeft'
import { correctOptionIndex, optionLabels } from '@/features/presenter/deck'
import { usePresenterStore } from '@/features/presenter/store'
import { turnKey } from '../controller'
import { type PlayView, type QuestionSlide as Slide } from '../engine'
import { FlashOverlay } from '../components/Flash'
import { GroupBadge } from '../components/GroupBadge'
import { GroupOptionTiles } from '../components/GroupOptionTiles'
import { Plaques } from '../components/Plaques'
import { groupColor } from '../colors'
import { useGroupStore } from '../store'

interface Props {
  slide: Slide
  pos: number
  view: PlayView
  /** Whether the options are on screen yet. */
  opts: boolean
  names: string[]
  scores: number[]
  lifelines: { fifty: boolean; hint: boolean }[]
  session: Session
  /** Seconds until the next question appears by itself (after an answer), or null. */
  autoIn: number | null
}

/** Largest code size that fits the box, by longest line and by line count. */
function codeSize(code: string, boxW = 1330, boxH = 330) {
  const lines = code.split('\n')
  const longest = Math.max(...lines.map((l) => l.length))
  return Math.max(26, Math.min(58, Math.floor(Math.min(boxW / (longest * 0.62), boxH / (lines.length * 1.38)))))
}

/**
 * Group-quiz question: scoreboard across the top, whose turn (and the clock) down the left,
 * the code or statement in the middle, then the question bar and answer rows on their rails.
 */
export function GroupQuestionSlide({ slide, pos, view, opts, names, scores, lifelines, session, autoIn }: Props) {
  const { question: q, category, rules } = slide
  const resolved = view.status !== 'open'
  const options = optionLabels(q) ?? []
  const correct = correctOptionIndex(q)
  const key = turnKey(pos, view.hop)
  const locked = usePresenterStore((s) => (s.locked?.key === key ? s.locked.index : null))
  const flash = useGroupStore((s) => s.flash)
  const code = q.tags.includes('code') && q.showcase
  const holder = view.holder

  return (
    <div className="relative flex h-full flex-col pb-9">
      {/* Top row: scoreboard between the NIET bug (added by the presenter) and the category */}
      <Plaques
        names={names}
        scores={scores}
        lit={resolved ? null : holder}
        won={view.status === 'won' ? view.winner : null}
        lifelines={rules.lifelines ? lifelines : undefined}
        className="absolute top-7 right-[470px] left-[390px] z-10"
      />
      <div className="absolute top-7 right-12 flex w-[400px] flex-col items-end gap-2">
        <Lozenge variant="gold" tip={22} className="h-[56px] max-w-full">
          <span className="truncate font-display text-[23px] font-extrabold tracking-wide whitespace-nowrap">
            {category?.icon} {category?.name ?? slide.round.title}
          </span>
        </Lozenge>
        <p className="pr-5 font-display text-[26px] leading-none font-extrabold text-white/55">
          {slide.tiebreak ? (
            <>
              Tie-breaker <span className="text-gold">{slide.n}</span>
            </>
          ) : (
            <>
              Question <span className="text-gold">{slide.n}</span> of {slide.of}
            </>
          )}
        </p>
      </div>

      {/* Upper stage */}
      <div data-upper-stage className="relative flex min-h-0 flex-1 gap-8 px-14 pt-[136px] pb-4">
        <TurnColumn
          view={view}
          holder={holder}
          names={names}
          rules={slide.rules}
          resolved={resolved}
          shown={opts}
          pos={pos}
          lifelines={lifelines[holder]}
          hasHint={Boolean(q.hint)}
          autoIn={autoIn}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div data-code-area className="flex min-h-0 flex-1 items-center justify-center">
            {code ? (
              <motion.pre
                key={q.id}
                data-code
                className="max-w-full overflow-hidden rounded-3xl bg-stage-950/80 px-12 py-7 text-left font-mono leading-[1.38] font-semibold whitespace-pre text-white ring-2 ring-white/10"
                style={{ fontSize: codeSize(q.showcase!) }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
              >
                {q.showcase}
              </motion.pre>
            ) : q.showcase ? (
              <motion.p
                key={q.id}
                className="max-w-[1250px] text-center font-display text-[52px] leading-[1.35] font-extrabold text-balance text-white drop-shadow-[0_0_30px_rgb(245_197_66/0.25)]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 160, damping: 14 }}
              >
                {q.showcase}
              </motion.p>
            ) : (
              <div className="opacity-25">
                <NietQuestEmblem size={300} glow={false} label={session.emblem?.label} mark={session.emblem?.mark} />
              </div>
            )}
          </div>

          {/* The hint before the answer, the explanation after: one reserved strip, so nothing jumps. */}
          <div data-info className="flex h-[112px] shrink-0 items-end justify-center pt-3">
            <AnimatePresence mode="wait">
              {resolved && q.explanation ? (
                <motion.p
                  key="why"
                  className="max-w-[1300px] rounded-2xl bg-black/70 px-8 py-3 text-center text-[27px] leading-snug text-white/90 ring-1 ring-gold/40 backdrop-blur"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  💡 {q.explanation}
                </motion.p>
              ) : !resolved && view.hintOn && q.hint ? (
                <motion.p
                  key="hint"
                  className="max-w-[1300px] rounded-2xl bg-lock/15 px-8 py-3 text-center text-[29px] leading-snug text-white ring-2 ring-lock/70"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="mr-3 font-display text-[22px] font-black tracking-[0.2em] text-lock uppercase">Hint</span>
                  {q.hint}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Question bar */}
      <div className="relative shrink-0 px-14">
        <Rail />
        <motion.div
          key={q.id}
          initial={{ opacity: 0, scaleX: 0.7 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Lozenge tip={56} className="min-h-[118px] py-3">
            <h2
              data-prompt
              className="w-full text-center font-display leading-[1.15] font-bold text-balance"
              style={{ fontSize: q.prompt.length > 62 ? 40 : 46 }}
            >
              {q.prompt}
            </h2>
          </Lozenge>
        </motion.div>
      </div>

      {/* Answers */}
      <div data-answers className="mt-5 min-h-[232px] shrink-0">
        {(opts || resolved) && (
          <GroupOptionTiles
            options={options}
            correct={correct}
            resolved={resolved}
            locked={locked}
            wrong={flash?.kind === 'wrong' ? (flash.k ?? null) : null}
            tried={view.tried}
            names={names}
            hidden={view.hidden}
            sequential={session.defaults.optionReveal === 'sequential'}
          />
        )}
      </div>

      <FlashOverlay flash={flash} />
    </div>
  )
}

interface ColumnProps {
  view: PlayView
  holder: number
  names: string[]
  rules: Slide['rules']
  resolved: boolean
  shown: boolean
  pos: number
  lifelines: { fifty: boolean; hint: boolean }
  hasHint: boolean
  autoIn: number | null
}

/** Left of the stage: who is answering and for how much, with the clock; after the answer, the verdict. */
function TurnColumn({ view, holder, names, rules, resolved, shown, pos, lifelines, hasHint, autoIn }: ColumnProps) {
  const { timer, left } = useTimeLeft()
  const color = groupColor(holder)
  const penalties = view.deltas.filter((d) => d.delta < 0)
  const showClock = !resolved && shown && timer.key === turnKey(pos, view.hop) && left > 0

  return (
    <div className="flex w-[320px] shrink-0 flex-col items-center justify-start gap-3 pt-2 text-center">
      <AnimatePresence mode="wait">
        {!resolved ? (
          <motion.div
            key={`turn-${holder}`}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ filter: `drop-shadow(0 0 22px ${color})` }}>
              <GroupBadge g={holder} name={names[holder]} size={96} />
            </div>
            <p className="mt-1 font-display text-[40px] leading-none font-black tracking-wide uppercase">Group {names[holder]}</p>
            <p className="font-display text-[19px] font-bold tracking-[0.3em] text-white/60 uppercase">to answer</p>
            <p className="mt-1 font-display text-[44px] leading-none font-black text-gold">
              {view.value} <span className="text-[24px] font-extrabold tracking-wider">PTS</span>
            </p>
            {view.hop > 0 && (
              <p className="font-display text-[19px] font-extrabold tracking-wider text-lock uppercase">
                passed on · {view.hop === 1 ? '1st' : '2nd'} chance
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="verdict"
            className="w-full"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          >
            <Lozenge
              variant={view.status === 'won' ? 'correct' : view.status === 'missed' ? 'wrong' : 'idle'}
              flash={view.status === 'won'}
              tip={44}
              rim={4}
              className="h-[190px]"
            >
              <span className="flex w-full flex-col items-center leading-none">
                {view.status === 'won' && view.winner !== null ? (
                  <>
                    <span className="font-display text-[22px] font-extrabold tracking-[0.2em] uppercase">
                      Group {names[view.winner]}
                    </span>
                    <span className="my-2 font-display text-[80px] font-black">
                      +{view.deltas.find((d) => d.delta > 0)?.delta ?? 0}
                    </span>
                    <span className="font-display text-[20px] font-extrabold tracking-[0.25em] uppercase">correct</span>
                  </>
                ) : view.status === 'missed' ? (
                  <>
                    <span className="font-display text-[32px] font-black uppercase">No points</span>
                    <span className="mt-2 font-display text-[19px] font-bold tracking-wider uppercase">
                      {rules.mode === 'rapid' ? 'missed' : 'everyone missed'}
                    </span>
                  </>
                ) : (
                  <span className="font-display text-[30px] font-black tracking-wide uppercase">Answer shown</span>
                )}
              </span>
            </Lozenge>
            {penalties.map((p, i) => (
              <p key={i} className="mt-2 font-display text-[22px] font-extrabold text-rose-300">
                Group {names[p.g]} {p.delta}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showClock && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 pb-8">
          <TimerRing />
        </motion.div>
      )}

      {!resolved && rules.lifelines && shown && (
        <div className="mt-1 flex gap-2 font-display text-[17px] font-black tracking-wider">
          <Chip live={!lifelines.fifty} label="50:50" keycap="L" />
          <Chip live={!lifelines.hint && hasHint} label="HINT" keycap="K" />
        </div>
      )}

      {resolved && autoIn !== null && (
        <p className="mt-1 font-display text-[19px] font-bold tracking-[0.2em] text-white/45 uppercase">
          next in <span className="text-gold">{autoIn}</span>
        </p>
      )}
    </div>
  )
}

function Chip({ live, label, keycap }: { live: boolean; label: string; keycap: string }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ring-1 ${live ? 'bg-gold/15 text-gold ring-gold/60' : 'text-white/25 line-through ring-white/10'}`}
    >
      {label}
      <kbd className="rounded bg-white/15 px-1.5 text-[13px] text-white/70 no-underline">{keycap}</kbd>
    </span>
  )
}
