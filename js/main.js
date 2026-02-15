'use strict'

const FLAG = '🏴'
const EXP = '💥'
const MARKED_MINE = '💣'

var gBoard
var gIntervalId
var gLevel = { SIZE: 4, MINES: 2 }
const gLevels = {
    beginner: { SIZE: 4, MINES: 2 },
    medium: { SIZE: 8, MINES: 14 },
    expert: { SIZE: 12, MINES: 32 }
}
const gGame = {
    isOn: false,
    isFirstClick: true,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0
}



function init() {

    gBoard = buildBoard(gLevel.SIZE)

    printBoard(gBoard)

    renderBoard(gBoard, '.board-container')

    updateTimer()
}

// function onKey(ev) {
// }

function onRightClick(elCell, i, j) {        
    onCellMarked(elCell, i, j)
}

function onCellClicked(elCell, i, j) {

    if (gGame.isFirstClick) {
        gGame.isOn = true
        startTimer()
        addMinesToBoard({i, j})
    }
    
    gGame.isFirstClick = false

    if (!gGame.isOn) return

    const cell = getCellObj({ i, j })

    if (cell.isMarked) return
    if (cell.isRevealed) return

    revCell(elCell, { i, j })

    if (cell.isMine) {
        loss()
        return
    }

    if (cell.minesAroundCount === 0) expandReveal(gBoard, elCell, i, j)
    

    if (checkGameOver()) victory()
}

function onCellMarked(elCell, i, j) {
    
    const cell = getCellObj({ i, j })

    if (cell.isRevealed) return

    if (cell.isMarked) {
        removeMark(elCell, cell)
        return
    }

    cell.isMarked = true
    elCell.innerText = FLAG
    gGame.markedCount++

    if (checkGameOver()) victory()
}

function onLevel(elLevel) {
    
    const level = elLevel.innerText.toLowerCase()

    gLevel = gLevels[level]
    restartGame()
}

function removeMark(elCell, cell) {

    cell.isMarked = false
    gGame.markedCount++


    elCell.innerText = ''
}

function expandReveal(board, elCell, i, j) {

    const cell = { i, j }

    for (var i = cell.i - 1; i <= cell.i + 1; i++) {
        if (i < 0 || i >= board.length) continue

        for (var j = cell.j - 1; j <= cell.j + 1; j++) {
            if (j < 0 || j >= board[i].length) continue
            if (i === cell.i && j === cell.j) continue

            if (!board[i][j].isMine && board[i][j].minesAroundCount === 0) revCell(getCellEl({ i, j }), { i, j })
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

function revCell(elCell, cellPos) {

    const cell = getCellObj(cellPos)
    const minesAround = cell.minesAroundCount

    if (cell.isMine && cell.isMarked) renderCell(cellPos, MARKED_MINE)
    else if (cell.isMine) renderCell(cellPos, EXP)
    else if (minesAround > 0) renderCell(cellPos, minesAround)

    cell.isRevealed = true
    elCell.classList.add('rev-cell')
    gGame.revealedCount++

    // if (!cell.isMine) expandReveal(gBoard, elCell, cellPos.i, cellPos.j)
    // elCell.innerText = cell.minesAroundCount
}

function restartGame() {

    endGame()
    resetGgame()
    init()
}

function resetGgame() {

    gGame.isFirstClick = true
    gGame.revealedCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0
}

function startTimer() {
    gIntervalId = setInterval(updateTimer, 1000)
}

function updateTimer() {
    const elTimer = document.querySelector('.timer')
    elTimer.innerText = (gGame.secsPassed++) + 's'
}

function victory() {
    alert('You Win!!')
    endGame()
}

function loss() {
    endGame()
    revAllMines()
}

function endGame() {
    gGame.isOn = false

    if (gIntervalId) {
        clearInterval(gIntervalId)
        gIntervalId = null
    }
}

function checkFirstClick() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (cell.isRevealed) return false
        }
    }

    return true
}

function checkGameOver() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (!cell.isMine && !cell.isRevealed) return false
            if (cell.isMine && !cell.isMarked) return false
        }
    }

    return true
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

function getAllCellPos() {
    const boardPoses = []

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            boardPoses.push({ i, j })
        }
    }

    return boardPoses
}