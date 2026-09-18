import { AnimatePresence, motion } from 'motion/react'
import type { Session } from '@/data/schema'
import { imageObscurity, stagesFor, timerStageIndex, type Slide } from '../deck'
import { MediaView } from '../components/MediaView'
import { OptionTiles } from '../components/OptionTiles'
import { TimerRing } from '../components/TimerRing'
import { useTimeLeft } from '../components/useTimeLeft'

type QuestionSlideData = Extract<Slide, { kind: 'question' }>

interface Props {
  slide: QuestionSlideData
  slideIndex: number
  stage: number
  session: Session
}

export function QuestionSlide({ slide, slideIndex, stage, session }: Props) {
  const { question: q, category, round, indexInRound } = slide
  const stages = stagesFor(slide)
  const stageKind = stages[stage]
  const revealed = stageKind === 'answer'
  const showOptions = stageKind === 'options' || revealed
  const hasMedia = Boolean(q.media)
  const sequential = session.defaults.optionReveal === 'sequential'

  const options = q.type === 'mcq' ? q.options : q.type === 'truefalse' ? ['True', 'False'] : null
  const correctIndex = q.type === 'mcq' ? q.answerIndex : q.type === 'truefalse' ? (q.answer ? 0 : 1) : -1

  return (
    <div className="flex h-full flex-col px-16 pt-12 pb-24">
      {/* Header: category, question number, timer */}
      <header className="flex h-[180px] shrink-0 items-start justify-between">
        <div className="space-y-4">
          {category && (
            <span className="inline-flex items-center gap-3 rounded-full bg-niet-blue px-6 py-2 font-display text-3xl font-bold ring-2 ring-white/15">
              {category.icon && <span>{category.icon}</span>}
              {category.name}
            </span>
          )}
          <p className="font-display text-4xl font-extrabold text-white/50">
            Question {indexInRound + 1}
            <span className="text-white/30"> / {round.questionIds.length}</span>
          </p>
        </div>
        <TimerSlot slideIndex={slideIndex} visible={stage >= timerStageIndex(slide) && !revealed} />
      </header>

      {/* Body */}
      <div className={`flex min-h-0 flex-1 gap-12 ${hasMedia ? 'flex-row' : 'flex-col'}`}>
        {q.media && (
          <motion.div
            className="min-h-0 w-[46%] shrink-0"
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            <MediaView media={q.media} obscurity={imageObscurity(slide, stage)} />
          </motion.div>
        )}

        <div className={`flex min-h-0 flex-1 flex-col ${hasMedia ? 'justify-center gap-10' : 'gap-14'}`}>
          <motion.h2
            className={`font-display leading-[1.15] font-extrabold text-balance ${hasMedia ? 'text-[56px]' : 'text-[76px]'}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {q.prompt}
          </motion.h2>

          {options && showOptions && (
            <OptionTiles options={options} correctIndex={correctIndex} revealed={revealed} sequential={sequential && !revealed} compact={hasMedia} />
          )}

          <AnimatePresence>
            {revealed && q.type === 'open' && (
              <motion.div
                className="rounded-[32px] bg-correct/15 px-10 py-8 ring-4 ring-correct shadow-[0_0_80px_rgb(34_197_94/0.35)]"
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16 }}
              >
                <p className="font-display text-3xl font-bold tracking-widest text-correct uppercase">Answer</p>
                <p className="mt-2 font-display text-7xl font-black">{q.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {revealed && q.explanation && (
              <motion.p
                className="text-4xl leading-snug text-white/75"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                💡 {q.explanation}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <HandsUp slideIndex={slideIndex} active={!revealed} />
    </div>
  )
}

function TimerSlot({ slideIndex, visible }: { slideIndex: number; visible: boolean }) {
  const { timer } = useTimeLeft()
  return (
    <AnimatePresence>
      {visible && timer.key === slideIndex && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
          <TimerRing />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** When time runs out: a big "Hands up!" flash, then a ribbon that stays until the reveal. */
function HandsUp({ slideIndex, active }: { slideIndex: number; active: boolean }) {
  const { timer, left } = useTimeLeft()
  const show = active && timer.key === slideIndex && left === 0

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="flash"
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.8, times: [0, 0.1, 0.75, 1] }}
          >
            <motion.div
              className="rounded-[48px] bg-niet-red px-24 py-12 font-display text-[160px] leading-none font-black shadow-[0_30px_120px_rgb(198_43_47/0.6)]"
              initial={{ scale: 0.3, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 12 }}
            >
              ✋ Hands up!
            </motion.div>
          </motion.div>
          <motion.div
            key="ribbon"
            className="absolute top-12 right-16 z-10 rounded-full bg-niet-red px-10 py-5 font-display text-5xl font-black shadow-xl"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.6 }}
          >
            ✋ Hands up!
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
