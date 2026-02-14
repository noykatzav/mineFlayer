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
    revealedCount: 0, 
    markedCount: 0, 
    secsPassed: 0 
}



function init() {
    gGame.isOn = true

    gBoard = buildBoard(gLevel.SIZE)
    
    printBoard(gBoard)

    renderBoard(gBoard, '.board-container')
    startTimer()

    //right click listener
    const elContainer = document.querySelector('table')
    elContainer.addEventListener('contextmenu', function (event) {
        event.preventDefault()

        if (gGame.isOn) onRightClick(event.target)
    })
}

// function onKey(ev) {
// }

function onRightClick(elClickedCell) {
    var clickedCellPos = extractElCellPos(elClickedCell)

    onCellMarked(elClickedCell, clickedCellPos.i, clickedCellPos.j)
}

function onCellClicked(elCell, i, j) {

    if (gGame.isOn === false) return
    
    const cell = getCellObj({i, j})

    console.log(cell)

    if (cell.isMarked) return
    if (cell.isRev) return
    
    revCell(elCell, {i, j})

    if (cell.isMine) {
        loss()
        return
    }

    if (cell.minesAroundCount === 0) expandReveal(gBoard, elCell, i, j)

    if (checkGameOver()) victory()
}

function onCellMarked(elCell,  i, j) {
    const cell = getCellObj({i, j})
    
    if (cell.isRev) return

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

    const cell = {i, j}

	for (var i = cell.i - 1; i <= cell.i + 1; i++) {
		if (i < 0 || i >= board.length) continue

		for (var j = cell.j - 1; j <= cell.j + 1; j++) {
			if (j < 0 || j >= board[i].length) continue
			if (i === cell.i && j === cell.j) continue

			if (!board[i][j].isMine && board[i][j].minesAroundCount === 0) revCell(getCellEl({i, j}), {i, j})
		}
	}
}  

function revAllMines() {
    
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (cell.isMine && !cell.isRev) revCell(getCellEl({i, j}), {i, j})
        }
    }
}

function revCell(elCell, cellPos) {

    const cell = getCellObj(cellPos)
    const minesAround = cell.minesAroundCount
    
    if (cell.isMine && cell.isMarked) renderCell(cellPos, MARKED_MINE)
    else if (cell.isMine) renderCell(cellPos, EXP)
    else if (minesAround > 0) renderCell(cellPos, minesAround)
    
    cell.isRev = true
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
    gGame.revealedCount = 0
    gGame.markedCount = 0
    gGame.secsPassed = 0 
}

function startTimer() {
    // const elTimer = document.querySelector('.timer')
    // elTimer.style.display = 'block'
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

function checkGameOver() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            const cell = gBoard[i][j]
            if (!cell.isMine && !cell.isRev) return false
            if (cell.isMine && !cell.isMarked) return false
        }
    }

    return true
}

function buildBoard(size=4) {
    var board = []
    const minesPoses = setRndMinesPos(gLevel.MINES)

    for (var i = 0; i < size; i++) {
        board.push([])

        for (var j = 0; j < size; j++) {
            board[i][j] = { minesAroundCount: 0, isRevealed: false, isMine: false, isMarked: false } 

            for (var minePos of minesPoses) {

                if (i === minePos.i && j === minePos.j) board[i][j].isMine = true
            }


            // if ((i === 1 && j === size - 1) || (i === size - 1 && j === 1)) board[i][j].isMine = true
        }
        
    }

    board = setMinesNegsCount(board)

    return board
}

function setMinesNegsCount(board) {

    for (var i = 0; i < board.length; i++) {

        for (var j = 0; j < board[i].length; j++) {

            if (!board[i][j].isMine) board[i][j].minesAroundCount = getMinesNegsCount({i, j}, board)
            
            // if (i === 0 || i === size - 1 ||
            //     j === 0 || j === size - 1 ||
            //     (j === 3 && i > 4 && i < size - 2)) {
            //     board[i][j] = WALL
            // }

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

function setRndMinesPos(minesCount) {
    const minesRndPoses = []
    const allCellPos = getAllCellPos()

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
            boardPoses.push({i, j})
        }
    }

    return boardPoses
}