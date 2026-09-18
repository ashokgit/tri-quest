/** Colours for answer tiles A, B, C, D (cycled if a question has more options). */
export const OPTION_COLORS = ['var(--color-opt-a)', 'var(--color-opt-b)', 'var(--color-opt-c)', 'var(--color-opt-d)']

export const optionColor = (i: number) => OPTION_COLORS[i % OPTION_COLORS.length]
export const optionLetter = (i: number) => String.fromCharCode(65 + i)
