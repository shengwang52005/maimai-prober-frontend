import { useState } from "react";

function useFixedGame(defaultGame = 'maimai'): ['maimai' | 'chunithm', (game: 'maimai' | 'chunithm') => void] {
  const [game, setGame] = useState(() => {
    const storedGame = localStorage.getItem('game');
    return storedGame ? JSON.parse(storedGame) : defaultGame;
  });

  return [game, setGame];
}

export default useFixedGame;