'use strict'

function printBoard(board) {
  const simpleBoard = []

  for (var i = 0; i < board.length; i++) {
    simpleBoard[i] = []
    var boardRow = board[i]

    for (var cell of boardRow) {
        if (cell.isMarked) simpleBoard[i].push(cell.isMine + ' ' + cell.minesAroundCount + ' ' + 'V')
        else simpleBoard[i].push(cell.isMine + ' ' + cell.minesAroundCount)
    }
  }

  console.log(simpleBoard)
}

function getCellEl(cell) {
    return document.querySelector(`.cell-${cell.i}-${cell.j}`)  
}

function getCellObj(cell) {
    return gBoard[cell.i][cell.j]
}

function renderBoard(mat, selector) {
    
    var strHTML = '<table><tbody>'
    for (var i = 0; i < mat.length; i++) {

        strHTML += '<tr>'
        for (var j = 0; j < mat[0].length; j++) {

            var className = `cell cell-${i}-${j}`

            if (mat[i][j].isRevealed) className += ' rev-cell'

            strHTML += `<td class="${className}" onclick="onCellClicked(this, ${i},${j})" oncontextmenu="event.preventDefault(); onRightClick(this, ${i},${j})"></td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'
    
    const elContainer = document.querySelector(selector)
    elContainer.innerHTML = strHTML
}

function extractElCellPos(elCell) {
    const cellClasses = elCell.classList

    for (var celClass of cellClasses) {
        if (celClass.includes('cell-')) {
            const cellIdxes = celClass.split('-')

            return ({i: cellIdxes[1], j: cellIdxes[2]})
        }
    }
}

function renderCell(pos, value) {
    // Select the elCell and set the value
    const elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
    elCell.innerHTML = value
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}