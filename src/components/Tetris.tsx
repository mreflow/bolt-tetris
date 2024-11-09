import React, { useState, useEffect, useCallback } from 'react';
import { useInterval } from '../hooks/useInterval';
import { Pause, Play, Rotate3D, ArrowDown, RefreshCw } from 'lucide-react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 800;

const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: 'bg-cyan-400',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: 'bg-blue-500',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: 'bg-orange-500',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-400',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 'bg-green-500',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 'bg-purple-500',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 'bg-red-500',
  },
};

const createBoard = () =>
  Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );

const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS);
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return {
    shape: TETROMINOS[randKey].shape,
    color: TETROMINOS[randKey].color,
    pos: { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 },
  };
};

export default function Tetris() {
  const [board, setBoard] = useState(createBoard());
  const [currentPiece, setCurrentPiece] = useState(randomTetromino());
  const [nextPiece, setNextPiece] = useState(randomTetromino());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [level, setLevel] = useState(1);

  const placePiece = useCallback(() => {
    const newBoard = [...board];
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = y + currentPiece.pos.y;
          const boardX = x + currentPiece.pos.x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });

    // Check for completed lines
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every((cell) => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        linesCleared++;
        y++;
      }
    }

    // Update score
    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared];
      setScore((prev) => prev + points * level);
      
      // Level up every 10 lines
      const newTotalLines = Math.floor(score / 1000) + linesCleared;
      const newLevel = Math.floor(newTotalLines / 10) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
        setSpeed((prev) => prev * 0.8);
      }
    }

    setBoard(newBoard);
    setCurrentPiece(nextPiece);
    setNextPiece(randomTetromino());

    // Check game over
    if (currentPiece.pos.y <= 0) {
      setGameOver(true);
    }
  }, [board, currentPiece, nextPiece, level, score]);

  const moveDown = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const newPos = { ...currentPiece.pos, y: currentPiece.pos.y + 1 };
    if (!checkCollision(currentPiece.shape, newPos)) {
      setCurrentPiece({ ...currentPiece, pos: newPos });
    } else {
      placePiece();
    }
  }, [board, currentPiece, gameOver, isPaused, nextPiece, level, score, placePiece]);

  const checkCollision = (shape, pos) => {
    return shape.some((row, y) =>
      row.some((cell, x) => {
        if (cell === 0) return false;
        const boardY = y + pos.y;
        const boardX = x + pos.x;
        return (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX] !== null)
        );
      })
    );
  };

  const rotate = () => {
    if (gameOver || isPaused) return;
    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map((row) => row[i]).reverse()
    );
    if (!checkCollision(rotated, currentPiece.pos)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  };

  const moveHorizontal = (dir) => {
    if (gameOver || isPaused) return;
    const newPos = { ...currentPiece.pos, x: currentPiece.pos.x + dir };
    if (!checkCollision(currentPiece.shape, newPos)) {
      setCurrentPiece({ ...currentPiece, pos: newPos });
    }
  };

  const hardDrop = () => {
    if (gameOver || isPaused) return;
    let newY = currentPiece.pos.y;
    while (!checkCollision(currentPiece.shape, { ...currentPiece.pos, y: newY + 1 })) {
      newY++;
    }
    setCurrentPiece({ ...currentPiece, pos: { ...currentPiece.pos, y: newY } }, () => {
      placePiece();
    });
  };

  const resetGame = () => {
    setBoard(createBoard());
    setCurrentPiece(randomTetromino());
    setNextPiece(randomTetromino());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
    setLevel(1);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
          hardDrop();
          break;
        case ' ':
          rotate();
          break;
        case 'p':
        case 'P':
          setIsPaused((prev) => !prev);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [gameOver, moveDown, hardDrop]);

  useInterval(moveDown, isPaused || gameOver ? null : speed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl shadow-2xl flex flex-col md:flex-row gap-8">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-10 gap-1 border-4 border-gray-700 p-2 bg-gray-900/50 rounded-lg">
            {board.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`w-6 h-6 rounded-sm ${
                    cell ||
                    (currentPiece.shape[y - currentPiece.pos.y]?.[
                      x - currentPiece.pos.x
                    ] &&
                      currentPiece.color) ||
                    'bg-gray-800'
                  } transition-colors`}
                />
              ))
            )}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => moveHorizontal(-1)}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <ArrowDown className="w-6 h-6 rotate-90" />
            </button>
            <button
              onClick={moveDown}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            <button
              onClick={() => moveHorizontal(1)}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <ArrowDown className="w-6 h-6 -rotate-90" />
            </button>
            <button
              onClick={rotate}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
            >
              <Rotate3D className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <h2 className="text-xl font-bold text-white mb-2">Next Piece</h2>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 4 }, (_, y) =>
                  Array.from({ length: 4 }, (_, x) => (
                    <div
                      key={`preview-${y}-${x}`}
                      className={`w-6 h-6 rounded-sm ${
                        nextPiece.shape[y]?.[x] ? nextPiece.color : 'bg-gray-800'
                      }`}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg">
              <div className="text-white mb-2">
                <p className="text-xl font-bold">Score: {score}</p>
                <p className="text-lg">Level: {level}</p>
              </div>
              <div className="text-gray-300 text-sm mt-4">
                <p>Controls:</p>
                <p>↑: Hard Drop</p>
                <p>←/→: Move</p>
                <p>↓: Soft Drop</p>
                <p>Space: Rotate</p>
                <p>P: Pause</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {isPaused ? (
                <>
                  <Play className="w-5 h-5" /> Resume
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5" /> Pause
                </>
              )}
            </button>
            <button
              onClick={resetGame}
              className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              <RefreshCw className="w-5 h-5" /> Reset
            </button>
          </div>

          {gameOver && (
            <div className="bg-red-900/50 p-4 rounded-lg text-center">
              <h2 className="text-xl font-bold text-white mb-2">Game Over!</h2>
              <p className="text-white">Final Score: {score}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}