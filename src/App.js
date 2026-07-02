import React, { useState, useEffect } from 'react';
import Board from './Board';
import HelpModal from './HelpModal';
import './App.css';

function App() {
  const [cells, setCells] = useState(Array(6).fill().map(() => Array(5).fill('')));
  const [cellsStatus, setCellsStatus] = useState(Array(6).fill().map(() => Array(5).fill('')));
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCell, setCurrentCell] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [usedLetters, setUsedLetters] = useState(new Set());
  const [message, setMessage] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [showModal, setShowModal] = useState(false);
//teste
  const initGame = () => {
    setTargetWord(getRandomWord());
    setCells(Array(6).fill().map(() => Array(5).fill('')));
    setCellsStatus(Array(6).fill().map(() => Array(5).fill('')));
    setCurrentRow(0);
    setCurrentCell(0);
    setGameOver(false);
    setUsedLetters(new Set());
    setMessage('');
  };

  const getRandomWord = () => {
    const words = [
      "ABRIR", "AMIGO", "BANHO", "CAIXA", "DIZER",
      "FALAR", "GOSTO", "HORAS", "JOGAR", "LIVRO",
      "NOITE", "OCUPA", "PAPEL", "QUASE",
      "RADIO", "SABER", "TARDE", "UNIDO", "VIVER"
    ];
    return words[Math.floor(Math.random() * words.length)];
  };

  const handleKeyPress = (key) => {
    if (gameOver) return;

    if (key === 'Enter') {
      const currentRowFilled = cells[currentRow].every(cell => cell !== '');
      if (currentRowFilled) {
        checkGuess();
      } else {
        setMessage('Preencha todas as letras!');
        setTimeout(() => setMessage(''), 2000);
      }
    } else if (key === 'Backspace') {
      if (currentCell > 0 && cells[currentRow][currentCell - 1] !== '') {
        // Remove a letra da posição anterior
        const newCells = [...cells];
        newCells[currentRow][currentCell - 1] = '';
        setCells(newCells);
        setCurrentCell(currentCell - 1);
      } else if (currentCell > 0 && cells[currentRow][currentCell - 1] === '') {
        // Se a célula atual está vazia, volta para a anterior
        setCurrentCell(currentCell - 1);
      }
    } else if (/^[A-Za-z]$/.test(key) && currentCell < 5) {
      // Adiciona a letra apenas se houver espaço
      const newCells = [...cells];
      newCells[currentRow][currentCell] = key.toUpperCase();
      setCells(newCells);

      // Move para a próxima célula se não for a última
      if (currentCell < 4) {
        setCurrentCell(currentCell + 1);
      }
    }
  };

  const checkGuess = () => {
    const guess = cells[currentRow].map(cell => cell.toUpperCase()).join('');

    if (guess === targetWord) {
      // Palavra correta, atualizar estado para mostrar vitória
      setCellsStatus(prevStatus => {
        const newStatus = [...prevStatus];
        newStatus[currentRow] = Array(5).fill('right');
        return newStatus;
      });
      setMessage('Acertou!');
      setGameOver(true);

      // Reiniciar o jogo após 2 segundos
      setTimeout(initGame, 2000);
    } else {
      // Palavra incorreta, atualizar o status das células
      let guessStatus = Array(5).fill('wrong');
      const targetLetters = targetWord.split('');

      // Primeiro passo: verificar letras corretas
      for (let i = 0; i < 5; i++) {
        if (cells[currentRow][i].toUpperCase() === targetLetters[i]) {
          guessStatus[i] = 'right';
          targetLetters[i] = null; // Marcar como verificada
        }
      }

      // Segundo passo: verificar letras no lugar errado
      for (let i = 0; i < 5; i++) {
        if (guessStatus[i] !== 'right') {
          const index = targetLetters.indexOf(cells[currentRow][i].toUpperCase());
          if (index !== -1) {
            guessStatus[i] = 'place';
            targetLetters[index] = null; // Marcar como verificada
          }
        }
      }

      setCellsStatus(prevStatus => {
        const newStatus = [...prevStatus];
        newStatus[currentRow] = guessStatus;
        return newStatus;
      });

      // Atualizar letras usadas
      const newUsedLetters = new Set(usedLetters);
      cells[currentRow].forEach((letter, index) => {
        // Só adiciona se for completamente errada (status 'wrong')
        // E não está em nenhuma posição da palavra alvo
        if (guessStatus[index] === 'wrong') {
          // Verifica se a letra não aparece em nenhuma posição da palavra alvo
          if (!targetWord.includes(letter.toUpperCase())) {
            newUsedLetters.add(letter.toUpperCase());
          }
        }
      });
      setUsedLetters(newUsedLetters);

      // Verificar condição de derrota
      if (currentRow === 5) {
        setMessage(`Tente novamente! A palavra era ${targetWord}`);
        setGameOver(true);

        // Reiniciar o jogo após 2 segundos
        setTimeout(initGame, 2000);
      } else {
        // Passar para a próxima linha
        setCurrentRow(currentRow + 1);
        setCurrentCell(0);
      }
    }
  };

  useEffect(() => {
    initGame(); // Inicializa o jogo quando o componente é montado
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      handleKeyPress(e.key);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentRow, currentCell, gameOver, cells]);

  return (
    <div className="container">
      <h1>Termo Clone</h1>
      <p>{targetWord}</p>
      <Board
        cells={cells}
        cellsStatus={cellsStatus}
        currentRow={currentRow}
        currentCell={currentCell}
        handleKeyPress={handleKeyPress}
        checkGuess={checkGuess}
        usedLetters={usedLetters}
        gameOver={gameOver}
      />
      <div className='used-letters'>Letras não presentes: {Array.from(usedLetters).join(', ')}</div>
      <button id="help-btn" className="help-btn" onClick={() => setShowModal(true)}>?</button>
      <HelpModal show={showModal} onClose={() => setShowModal(false)} />
      <div id="message" className="message">{message}</div>
    </div>
  );
}

export default App;
