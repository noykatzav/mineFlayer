'use strict'

const FLAG = '🏴'
const EXP = '💥'
const MINE = '💣'
const LIVES = { LIFE: '❤️', NO_LIVES: '💔' }
const SMILEY = { NORMAL: '😊', DEAD: '🤯', WIN: '😎' }
const HINT = '💡'

var gBoard
var gIntervalId
var gLevel = { NAME: 'Beginner', SIZE: 4, MINES: 2 }
const gLevels = {
    beginner: { NAME: 'Beginner', SIZE: 4, MINES: 2 },
    medium: { NAME: 'Medium', SIZE: 8, MINES: 14 },
    expert: { NAME: 'Expert', SIZE: 12, MINES: 32 }
}
const gGame = {
    isOn: false,
    isFirstClick: true,
    isHintMode: false,
    hints: 3,
    safeClicks: 3,
    revealedCount: 0,
    markedCount: 0,
    score: 0,
    secsPassed: 0,
    lives: 3
}



function init() {
    gBoard = buildBoard(gLevel.SIZE)

    // localStorage.clear()

    renderBoard(gBoard, '.board-container')
    renderControlArea()
}

function onCellClicked(elCell, i, j) {

    // start game only on first click
    if (gGame.isFirstClick && gGame.isHintMode) {
        gGame.isHintMode = false
        return
    } else if (gGame.isFirstClick) {
        gGame.isOn = true
        startTimer()
        addMinesToBoard({ i, j })

        printBoard(gBoard)
    }
    gGame.isFirstClick = false

    // no action when game is off
    if (!gGame.isOn) return

    // no action for revealed/marked cells
    const cell = getCellObj({ i, j })

    if (cell.isMarked) return
    if (cell.isRevealed) return
    if (cell.timeoutID) return

    // handling hints
    if (gGame.isHintMode) {
        gGame.hints--

        console.log('used hint')

        renderControlEl(HINT, gGame.hints)

        showCell(elCell, { i, j })
        showNeighbors(gBoard, i, j)

        gGame.isHintMode = false
        return
    }

    // click a Mine/unrevealed empty cell
    if (cell.isMine) {
        gGame.lives--
        gGame.score -= 3
        console.log('lost life, score:', gGame.score)

        if (gGame.lives > 0) {
            showCell(elCell, { i, j })

            // update lives icon
            renderControlEl(LIVES.LIFE, gGame.lives)
        } else {
            revCell(elCell, { i, j })

            if (cell.isMine) {
                // update lives icon
                renderControlEl(LIVES.NO_LIVES)
                loss()
                return
            }
        }

        return
    } else revCell(elCell, { i, j })

    if (cell.minesAroundCount === 0) expandReveal(gBoard, i, j)

    if (checkVictory()) victory()
}

function onCellMarked(elCell, i, j) {

    if (!gGame.isFirstClick && !gGame.isOn) return

    const cell = getCellObj({ i, j })

    if (cell.isRevealed) return
    if (cell.timeoutID) return

    if (cell.isMarked) {
        removeMark(elCell, cell)
        return
    }

    cell.isMarked = true
    elCell.innerText = FLAG
    gGame.markedCount++

    if (checkVictory()) victory()
}

function onLevel(elLevel) {

    const level = elLevel.innerText.toLowerCase()

    gLevel = gLevels[level]
    gGame.score = 0
    restartGame()
}

function onHint() {
    
    if (gGame.hints === 0) return

    gGame.isHintMode = true
}

function onSafeClick() {

    if (gGame.safeClicks === 0) return

    const notRevCellPos = getNotRevCellPos()
    const rndIdx = getRandomInt(0, notRevCellPos.length)
    const rndPos = notRevCellPos[rndIdx]

    showCell(getCellEl(rndPos), rndPos)

    gGame.safeClicks--

    renderSafeClick()
}

function removeMark(elCell, cell) {

    cell.isMarked = false
    gGame.markedCount++


    elCell.innerText = ''
}

function expandReveal(board, i, j) {
    const cell = { i, j }

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === cell.i && j === cell.j) continue

            if (!board[i][j].isMine && !board[i][j].isRevealed) {
                revCell(getCellEl({ i, j }), { i, j })
                
                if (board[i][j].minesAroundCount === 0) {
                    expandReveal(board, i, j)
                }
            } 

        }
    }
}

function showCell(elCell, cellPos) {

    const cell = getCellObj(cellPos)

    const currVal = elCell.innerText

    if (cell.isRevealed) return

    revCellEl(elCell, cellPos)

    cell.timeoutID = setTimeout(() => {
        unRevCell(elCell, cell, cellPos, currVal)
    }, 1500)
}

function showNeighbors(board, i, j) {

    const cell = { i, j }

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === cell.i && j === cell.j) continue

            if (gGame.isHintMode) showCell(getCellEl({ i, j }), { i, j })
        }
    }
}

function revAllMines() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (cell.isMine && !cell.isRevealed) revCell(getCellEl({ i, j }), { i, j })
        }
    }
}

function unRevCell(elCell, cell, cellPos, oldVal) {

    renderCell(cellPos, oldVal)

    elCell.classList.remove('rev-cell')

    clearTimeout(cell.timeoutID)
    cell.timeoutID = null
}

function revCell(elCell, cellPos) {
    revCellEl(elCell, cellPos)
    revCellUpdateModel(cellPos)
}

function revCellEl(elCell, cellPos) {

    const cell = getCellObj(cellPos)

    if (cell.isRevealed) return

    if (cell.isMine && (cell.isMarked || gGame.isHintMode || gGame.lives > 0)) renderCell(cellPos, MINE)
    else if (cell.isMine) renderCell(cellPos, EXP)
    else if (cell.minesAroundCount > 0) renderCell(cellPos, cell.minesAroundCount)

    elCell.classList.add('rev-cell')
}

function revCellUpdateModel(cellPos) {

    const cell = getCellObj(cellPos)

    if (cell.isRevealed) return
    
    cell.isRevealed = true

    if (!cell.isMine) gGame.revealedCount++
}

function restartGame() {

    endGame()
    resetGgame()
    init()
}

function resetGgame() {

    gGame.isFirstClick = true
    gGame.isHintMode = false
    gGame.hints = 3
    gGame.safeClicks = 3
    gGame.revealedCount = 0
    gGame.markedCount = 0
    gGame.score = 0
    gGame.secsPassed = 0
    gGame.lives = 3
}

function startTimer() {
    gIntervalId = setInterval(updateTimer, 1000)
}

function updateTimer() {
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = (gGame.secsPassed++) + 's'
}

function calcScore() {
    var markedMinesScore = 0

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (cell.isMine && cell.isMarked) markedMinesScore += 2
        }
    }

    gGame.score += markedMinesScore + gGame.revealedCount
    if (gGame.score < 0) gGame.score = 0
}

function victory() {
    calcScore() // keep before endGame()
    endGame()
    renderControlEl(SMILEY.WIN)
    alert('You Win!! Your Score ' + gGame.score)
    console.log('You Win!! Score', gGame.score)

}

function loss() {
    calcScore() // keep before endGame()
    console.log('You lose! Score', gGame.score)
    endGame()
    revAllMines()
    renderControlEl(SMILEY.DEAD)
}

function endGame() {
    gGame.isOn = false


    if (gIntervalId) {
        clearInterval(gIntervalId)
        gIntervalId = null
    }

    // update best scores board
    const level = gLevel.NAME.toLowerCase()
    var bestScoresLoc = localStorage.getItem('bestScores') || '{}'

    bestScoresLoc = JSON.parse(bestScoresLoc)

    if (!bestScoresLoc[level] || gGame.score > bestScoresLoc[level]) {
        bestScoresLoc[level] = gGame.score
        localStorage.setItem('bestScores', JSON.stringify(bestScoresLoc))

    }

    renderBestScore()
    console.log('updated board', JSON.parse(localStorage.getItem('bestScores')))
}

function checkVictory() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (!cell.isMine && !cell.isRevealed) return false
            if (cell.isMine && !cell.isMarked) return false
        }
    }

    return true
}

function renderBestScore() {
    const bestScoresLoc = JSON.parse(localStorage.getItem('bestScores'))

    var strHTML = '<h2>Best Scores 🏆</h2>\n<p>'

    if (bestScoresLoc.beginner) strHTML += `\nBeginner ${bestScoresLoc.beginner}<br>`
    if (bestScoresLoc.medium) strHTML += `\nMedium ${bestScoresLoc.medium}<br>`
    if (bestScoresLoc.expert) strHTML += `\nExpert ${bestScoresLoc.expert}<br>`
    
    strHTML += '\n</p>'

    const elContainer = document.querySelector('.best-score-board')
    elContainer.innerHTML = strHTML
}

function renderControlArea() {

    renderControlEl(SMILEY.NORMAL)
    renderControlEl(LIVES.LIFE, gGame.lives)
    renderControlEl(HINT, gGame.hints)
    renderSafeClick()

    updateTimer()
}

function renderControlEl(value, repeat = 1) {
    var selector

    if (value === HINT) selector = '.hints'
    else if (Object.values(LIVES).includes(value)) selector = '.lives'
    else if (Object.values(SMILEY).includes(value)) selector = '.smiley'

    const elControl = document.querySelector(selector)
    elControl.innerHTML = value.repeat(repeat)
}

function renderSafeClick() {

    const elSafeClickButton = document.querySelector('.safe-click')
    
    if (gGame.safeClicks === 0) elSafeClickButton.style.backgroundColor = 'lightgray'
    
    const elSafeClicksCnt = elSafeClickButton.querySelector('span')
    elSafeClicksCnt.innerText = ' ' + gGame.safeClicks
}

function buildBoard(size = 4) {

    var board = []

    for (var i = 0; i < size; i++) {
        board.push([])

        for (var j = 0; j < size; j++) {
            board[i][j] = { minesAroundCount: 0, isRevealed: false, isMine: false, isMarked: false }
        }

    }

    return board
}

function addMinesToBoard(firstClickPos) {

    const minesPoses = setRndMinesPos(gLevel.MINES, firstClickPos)

    for (var i = 0; i < gBoard.length; i++) {

        for (var j = 0; j < gBoard[i].length; j++) {
            for (var minePos of minesPoses) {

                if (i === minePos.i && j === minePos.j) gBoard[i][j].isMine = true
            }

            // if ((i === 1 && j === size - 1) || (i === size - 1 && j === 1)) gBoard[i][j].isMine = true
        }

    }

    gBoard = setMinesNegsCount(gBoard)
}

function setMinesNegsCount(board) {

    for (var i = 0; i < board.length; i++) {

        for (var j = 0; j < board[i].length; j++) {

            if (!board[i][j].isMine) board[i][j].minesAroundCount = getMinesNegsCount({ i, j }, board)
        }
    }

    return board
}

function getMinesNegsCount(cell, board) {
    var count = 0

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === cell.i && j === cell.j) continue

            if (board[i][j].isMine) count++
        }
    }

    return count
}

function setRndMinesPos(minesCount, firstClickPos) {

    const minesRndPoses = []
    const allCellPos = getAllCellPos()
    const firstClickIdx = allCellPos.findIndex(cellPos => (cellPos.i === firstClickPos.i && cellPos.j === firstClickPos.j))

    allCellPos.splice(firstClickIdx, 1)

    for (var i = 0; i < minesCount; i++) {
        const rndIdx = getRandomInt(0, allCellPos.length)
        const rndPos = allCellPos[rndIdx]

        minesRndPoses.push(rndPos)
        allCellPos.splice(rndIdx, 1)
    }

    return minesRndPoses
}

function getNotRevCellPos() {
    const boardPoses = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isRevealed && !gBoard[i][j].isMine)
                boardPoses.push({ i, j })
        }
    }

    return boardPoses
}

function getAllCellPos() {
    const boardPoses = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            boardPoses.push({ i, j })
        }
    }

    return boardPoses
}