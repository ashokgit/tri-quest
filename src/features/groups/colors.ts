/** One colour per group, picked to stay clear of gold (highlight), green (right) and red (wrong). */
export const GROUP_COLORS = ['#3b82f6', '#14b8a6', '#c084fc', '#f472b6']

export const groupColor = (g: number) => GROUP_COLORS[g % GROUP_COLORS.length]
