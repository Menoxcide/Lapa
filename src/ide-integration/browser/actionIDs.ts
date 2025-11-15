// Normally you'd want to put these exports in the files that register them, but if you do that you'll get an import order error if you import them in certain cases.
// (importing them runs the whole file to get the ID, causing an import error). I guess it's best practice to separate out IDs, pretty annoying...

export const LAPA_CTRL_L_ACTION_ID = 'lapa.ctrlLAction'

export const LAPA_CTRL_K_ACTION_ID = 'lapa.ctrlKAction'

export const LAPA_ACCEPT_DIFF_ACTION_ID = 'lapa.acceptDiff'

export const LAPA_REJECT_DIFF_ACTION_ID = 'lapa.rejectDiff'

export const LAPA_GOTO_NEXT_DIFF_ACTION_ID = 'lapa.goToNextDiff'

export const LAPA_GOTO_PREV_DIFF_ACTION_ID = 'lapa.goToPrevDiff'

export const LAPA_GOTO_NEXT_URI_ACTION_ID = 'lapa.goToNextUri'

export const LAPA_GOTO_PREV_URI_ACTION_ID = 'lapa.goToPrevUri'

export const LAPA_ACCEPT_FILE_ACTION_ID = 'lapa.acceptFile'

export const LAPA_REJECT_FILE_ACTION_ID = 'lapa.rejectFile'

export const LAPA_ACCEPT_ALL_DIFFS_ACTION_ID = 'lapa.acceptAllDiffs'

export const LAPA_REJECT_ALL_DIFFS_ACTION_ID = 'lapa.rejectAllDiffs'
