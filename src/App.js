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
  
  // 1. Estados adicionados para Modo Dark e Estatísticas
  const [darkMode, setDarkMode] = useState(false);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const initGame = async () => {
    setCells(Array(6).fill().map(() => Array(5).fill('')));
    setCellsStatus(Array(6).fill().map(() => Array(5).fill('')));
    setCurrentRow(0);
    setCurrentCell(0);
    setGameOver(false);
    setUsedLetters(new Set());
    setMessage('');

    // Lista reserva de palavras para o jogo nunca travar na palavra "TERMO"
    const palavrasReserva = [
      "CHAVE", "PORTA", "MENTE", "FORTE", "VITAL", 
      "PLANO", "TEMPO", "VALOR", "BRAVO", "MUNDO", 
      "CAMPO", "JUSTO", "LINDO", "FESTA", "FONTE"
    ];

    try {
      // Tenta buscar uma palavra aleatória no Dicionário Aberto
      const response = await fetch('https://dicionario-aberto.net');
      const data = await response.json();
      
      // Valida se a palavra retornada tem exatamente 5 letras
      if (data.word && data.word.length === 5) {
        // Limpa acentos e joga para maiúsculo
        const palavraLimpa = data.word.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        setTargetWord(palavraLimpa);
      } else {
        // Se a palavra da API não tiver 5 letras, pega uma da nossa lista reserva
        const sorteada = palavrasReserva[Math.floor(Math.random() * palavrasReserva.length)];
        setTargetWord(sorteada);
      }
    } catch (error) {
      // Se a API falhar ou der erro de rede, escolhe uma da lista reserva de forma aleatória
      const sorteada = palavrasReserva[Math.floor(Math.random() * palavrasReserva.length)];
      setTargetWord(sorteada);
    }
  };


  // Pode apagar a função getRandomWord antiga, ela não será mais necessária!


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
        const newCells = [...cells];
        newCells[currentRow][currentCell - 1] = '';
        setCells(newCells);
        setCurrentCell(currentCell - 1);
      } else if (currentCell > 0 && cells[currentRow][currentCell - 1] === '') {
        setCurrentCell(currentCell - 1);
      }
    } else if (/^[A-Za-z]$/.test(key) && currentCell < 5) {
      const newCells = [...cells];
      newCells[currentRow][currentCell] = key.toUpperCase();
      setCells(newCells);

      if (currentCell < 4) {
        setCurrentCell(currentCell + 1);
      }
    }
  };

  const checkGuess = () => {
    const guess = cells[currentRow].map(cell => cell.toUpperCase()).join('');

    if (guess === targetWord) {
      setCellsStatus(prevStatus => {
        const newStatus = [...prevStatus];
        newStatus[currentRow] = Array(5).fill('right');
        return newStatus;
      });
      setMessage('Acertou!');
      setGameOver(true);
      
      // 2. Incrementa vitória
      setWins(prev => prev + 1);

      setTimeout(initGame, 2000);
    } else {
      let guessStatus = Array(5).fill('wrong');
      const targetLetters = targetWord.split('');

      for (let i = 0; i < 5; i++) {
        if (cells[currentRow][i].toUpperCase() === targetLetters[i]) {
          guessStatus[i] = 'right';
          targetLetters[i] = null;
        }
      }

      for (let i = 0; i < 5; i++) {
        if (guessStatus[i] !== 'right') {
          const index = targetLetters.indexOf(cells[currentRow][i].toUpperCase());
          if (index !== -1) {
            guessStatus[i] = 'place';
            targetLetters[index] = null;
          }
        }
      }

      setCellsStatus(prevStatus => {
        const newStatus = [...prevStatus];
        newStatus[currentRow] = guessStatus;
        return newStatus;
      });

      const newUsedLetters = new Set(usedLetters);
      cells[currentRow].forEach((letter, index) => {
        if (guessStatus[index] === 'wrong') {
          if (!targetWord.includes(letter.toUpperCase())) {
            newUsedLetters.add(letter.toUpperCase());
          }
        }
      });
      setUsedLetters(newUsedLetters);

      if (currentRow === 5) {
        setMessage(`Tente novamente! A palavra era ${targetWord}`);
        setGameOver(true);
        
        // 3. Incrementa derrota
        setLosses(prev => prev + 1);

        setTimeout(initGame, 2000);
      } else {
        setCurrentRow(currentRow + 1);
        setCurrentCell(0);
      }
    }
  };

  useEffect(() => {
    initGame();
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

  // 4. Cálculo da porcentagem de vitórias baseado no total de jogos
  const totalGames = wins + losses;
  const winPercentage = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

  return (
    // 5. Inserida classe condicional 'dark-mode' na div principal
    <div className={`container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="header-actions">
        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? 'Modo Clarinho' : 'Modo Escurinho'}
        </button>
      </div>

      <h1>Termo Clone</h1>
{/* <p>{targetWord}</p> */}

      {/* 6. Painel de Estatísticas adicionado */}
      <div className="stats-container">
        <span>Vitórias: {wins} ({winPercentage}%)</span>
        <span>Derrotas: {losses}</span>
      </div>

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