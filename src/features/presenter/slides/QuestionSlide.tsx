import { AnimatePresence, motion } from 'motion/react'
import type { Session } from '@/data/schema'
import { imageObscurity, stagesFor, timerStageIndex, type Slide } from '../deck'
import { Lozenge, Rail } from '../components/Lozenge'
import { MediaView } from '../components/MediaView'
import { OptionTiles } from '../components/OptionTiles'
import { TimerRing } from '../components/TimerRing'
import { TriQuestEmblem } from '../components/TriQuestEmblem'
import { useTimeLeft } from '../components/useTimeLeft'
import { usePresenterStore } from '../store'

type QuestionSlideData = Extract<Slide, { kind: 'question' }>

interface Props {
  slide: QuestionSlideData
  slideIndex: number
  stage: number
  session: Session
}

/**
 * Game-show layout: the upper stage holds the timer and media (or the emblem),
 * the question bar and answer rows sit on rails across the bottom.
 */
export function QuestionSlide({ slide, slideIndex, stage, session }: Props) {
  const { question: q, category, round, indexInRound } = slide
  const stageKind = stagesFor(slide)[stage]
  const revealed = stageKind === 'answer'
  const showOptions = stageKind === 'options' || revealed
  const locked = usePresenterStore((s) => (s.locked?.key === slideIndex ? s.locked.index : null))

  const options = q.type === 'mcq' ? q.options : q.type === 'truefalse' ? ['True', 'False'] : null
  const correctIndex = q.type === 'mcq' ? q.answerIndex : q.type === 'truefalse' ? (q.answer ? 0 : 1) : -1

  return (
    <div className="relative flex h-full flex-col pb-14">
      {/* Top corners: category and question number */}
      <div className="absolute top-12 right-14 flex flex-col items-end gap-3">
        <Lozenge variant="gold" tip={26} className="h-[64px]">
          <span className="font-display text-[28px] font-extrabold tracking-wide whitespace-nowrap">
            {category?.icon} {category?.name ?? round.title}
          </span>
        </Lozenge>
        <p className="pr-6 font-display text-3xl font-extrabold text-white/55">
          Question <span className="text-gold">{indexInRound + 1}</span> of {round.questionIds.length}
        </p>
      </div>

      {/* Upper stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-40 pt-10 pb-8">
        {q.media ? (
          <motion.div
            className="relative h-full max-h-[520px] w-full max-w-[1100px]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          >
            <MediaView media={q.media} obscurity={imageObscurity(slide, stage)} />
          </motion.div>
        ) : (
          <div className="opacity-25">
            <TriQuestEmblem size={380} glow={false} />
          </div>
        )}

        <TimerSlot slideIndex={slideIndex} visible={stage >= timerStageIndex(slide) && !revealed} />

        <AnimatePresence>
          {revealed && q.explanation && (
            <motion.div
              className="absolute inset-x-0 bottom-6 flex justify-center px-40"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
            >
              <p className="max-w-[1300px] rounded-2xl bg-black/70 px-10 py-5 text-center text-[34px] leading-snug text-white/90 ring-1 ring-gold/40 backdrop-blur">
                💡 {q.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Question bar */}
      <div className="relative shrink-0 px-16">
        <Rail />
        <motion.div initial={{ opacity: 0, scaleX: 0.7 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
          <Lozenge tip={60} className="min-h-[190px] py-6">
            <h2 className="w-full text-center font-display text-[54px] leading-[1.18] font-bold text-balance">{q.prompt}</h2>
          </Lozenge>
        </motion.div>
      </div>

      {/* Answers */}
      <div className="mt-6 min-h-[118px] shrink-0">
        {options && showOptions && (
          <OptionTiles
            options={options}
            correctIndex={correctIndex}
            revealed={revealed}
            lockedIndex={locked}
            sequential={session.defaults.optionReveal === 'sequential'}
          />
        )}
        {q.type === 'open' && revealed && (
          <div className="relative px-16">
            <Rail />
            <motion.div
              className="relative mx-auto w-[70%]"
              initial={{ opacity: 0, scaleX: 0.5 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Lozenge variant="correct" flash className="h-[118px]">
                <span className="w-full text-center font-display text-[48px] font-black">{q.answer}</span>
              </Lozenge>
            </motion.div>
          </div>
        )}
      </div>

      <HandsUp slideIndex={slideIndex} active={!revealed && locked === null} />
    </div>
  )
}

function TimerSlot({ slideIndex, visible }: { slideIndex: number; visible: boolean }) {
  const { timer, left } = useTimeLeft()
  // At zero the "Hands up!" badge takes the clock's place.
  return (
    <AnimatePresence>
      {visible && timer.key === slideIndex && left > 0 && (
        <motion.div
          className="absolute top-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
        >
          <TimerRing />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** When time runs out: a big "Hands up!" flash, then a badge that stays until an answer is locked or revealed. */
function HandsUp({ slideIndex, active }: { slideIndex: number; active: boolean }) {
  const { timer, left } = useTimeLeft()
  const show = active && timer.key === slideIndex && left === 0

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="flash"
            className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2, times: [0, 0.08, 0.8, 1] }}
          >
            <motion.div
              initial={{ scale: 0.3 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 13 }}
            >
              <Lozenge variant="locked" tip={90} rim={5} className="h-[240px] px-10">
                <span className="font-display text-[150px] font-black tracking-tight">✋ HANDS UP!</span>
              </Lozenge>
            </motion.div>
          </motion.div>
          <motion.div
            key="badge"
            className="absolute top-12 left-1/2 z-10 -translate-x-1/2"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.8 }}
          >
            <Lozenge variant="locked" tip={36} className="h-[96px]">
              <span className="font-display text-[52px] font-black whitespace-nowrap">✋ HANDS UP!</span>
            </Lozenge>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
