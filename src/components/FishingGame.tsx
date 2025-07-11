import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, DollarSign, Gamepad2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Fish {
  id: string;
  x: number;
  y: number;
  type: 'small' | 'medium' | 'large' | 'shark';
  value: number;
  speedX: number;
  speedY: number;
  directionX: number;
  directionY: number;
  color: string;
  size: number;
  swimAngle: number;
}

interface GameState {
  money: number;
  timer: number;
  isPlaying: boolean;
  score: number;
  fishCaught: number;
}

interface TimingGame {
  isActive: boolean;
  fish: Fish | null;
  progress: number;
  targetZone: { start: number; end: number };
  success: boolean;
}

const FISH_TYPES = {
  small: { value: 10, color: '#4F46E5', size: 20, speedX: 2, speedY: 1 },
  medium: { value: 25, color: '#EF4444', size: 30, speedX: 1.5, speedY: 0.8 },
  large: { value: 50, color: '#F59E0B', size: 40, speedX: 1, speedY: 0.6 },
  shark: { value: 100, color: '#6B7280', size: 60, speedX: 0.8, speedY: 0.4 },
};

export function FishingGame() {
  const [gameState, setGameState] = useState<GameState>({
    money: 120,
    timer: 137,
    isPlaying: false,
    score: 0,
    fishCaught: 0,
  });
  
  const [fish, setFish] = useState<Fish[]>([]);
  const [fishingLine, setFishingLine] = useState({ length: 0, isExtending: false, isRetracting: false });
  const [boatPosition, setBoatPosition] = useState(400);
  const [caughtFish, setCaughtFish] = useState<Fish | null>(null);
  const [timingGame, setTimingGame] = useState<TimingGame>({
    isActive: false,
    fish: null,
    progress: 0,
    targetZone: { start: 60, end: 80 },
    success: false,
  });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const timingRef = useRef<number>();

  // Generate fish with improved swimming patterns
  const generateFish = useCallback(() => {
    const newFish: Fish[] = [];
    for (let i = 0; i < 15; i++) {
      const fishType = Math.random() < 0.4 ? 'small' : 
                      Math.random() < 0.3 ? 'medium' : 
                      Math.random() < 0.2 ? 'large' : 'shark';
      
      newFish.push({
        id: `fish-${i}`,
        x: Math.random() * 750,
        y: 280 + Math.random() * 280,
        type: fishType,
        value: FISH_TYPES[fishType].value,
        speedX: FISH_TYPES[fishType].speedX + Math.random() * 0.5,
        speedY: FISH_TYPES[fishType].speedY + Math.random() * 0.3,
        directionX: Math.random() > 0.5 ? 1 : -1,
        directionY: Math.random() > 0.5 ? 1 : -1,
        color: FISH_TYPES[fishType].color,
        size: FISH_TYPES[fishType].size,
        swimAngle: Math.random() * Math.PI * 2,
      });
    }
    setFish(newFish);
  }, []);

  // Fixed fish animation loop
  const animate = useCallback(() => {
    if (!gameState.isPlaying || gameState.timer <= 0) return;
    
    setFish(prevFish => 
      prevFish.map(f => {
        let newX = f.x + f.speedX * f.directionX;
        let newY = f.y + f.speedY * f.directionY * Math.sin(f.swimAngle);
        let newDirectionX = f.directionX;
        let newDirectionY = f.directionY;
        const newSwimAngle = f.swimAngle + 0.02;

        // Bounce off walls
        if (newX <= 0 || newX >= 750) {
          newDirectionX = -newDirectionX;
          newX = Math.max(0, Math.min(750, newX));
        }
        
        // Bounce off water boundaries
        if (newY <= 280 || newY >= 580) {
          newDirectionY = -newDirectionY;
          newY = Math.max(280, Math.min(580, newY));
        }

        return {
          ...f,
          x: newX,
          y: newY,
          directionX: newDirectionX,
          directionY: newDirectionY,
          swimAngle: newSwimAngle,
        };
      })
    );
    
    animationRef.current = requestAnimationFrame(animate);
  }, [gameState.isPlaying, gameState.timer]);

  // Start the fish animation when game starts
  useEffect(() => {
    if (gameState.isPlaying && gameState.timer > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState.isPlaying, animate]);

  // Timing game animation
  const animateTimingGame = useCallback(() => {
    if (!timingGame.isActive) return;
    
    setTimingGame(prev => {
      const newProgress = prev.progress + 2;
      if (newProgress >= 100) {
        return { ...prev, progress: 0 };
      }
      return { ...prev, progress: newProgress };
    });
    
    timingRef.current = requestAnimationFrame(animateTimingGame);
  }, [timingGame.isActive]);

  // Handle timing game click
  const handleTimingClick = () => {
    if (!timingGame.isActive || !timingGame.fish) return;
    
    const { progress, targetZone } = timingGame;
    const success = progress >= targetZone.start && progress <= targetZone.end;
    
    if (success) {
      setGameState(prev => ({
        ...prev,
        money: prev.money + timingGame.fish!.value,
        fishCaught: prev.fishCaught + 1,
      }));
      setCaughtFish(timingGame.fish);
      setTimingGame(prev => ({ ...prev, success: true }));
      
      setTimeout(() => {
        setTimingGame({
          isActive: false,
          fish: null,
          progress: 0,
          targetZone: { start: 60, end: 80 },
          success: false,
        });
        setCaughtFish(null);
      }, 1000);
    } else {
      setTimingGame({
        isActive: false,
        fish: null,
        progress: 0,
        targetZone: { start: 60, end: 80 },
        success: false,
      });
    }
  };

  // Start game
  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true }));
    setFishingLine({ length: 0, isExtending: false, isRetracting: false });
    generateFish();
  };

  // Handle fishing line control with space bar
  const handleFishingLineControl = () => {
    if (!gameState.isPlaying || timingGame.isActive) return;
    
    if (!fishingLine.isExtending && !fishingLine.isRetracting && fishingLine.length === 0) {
      // Start extending line
      setFishingLine(prev => ({ ...prev, isExtending: true }));
    } else if (fishingLine.isExtending) {
      // Stop extending and check for fish
      setFishingLine(prev => ({ ...prev, isExtending: false }));
      
      // Check for fish catch
      const lineEndY = 220 + fishingLine.length;
      const nearbyFish = fish.find(f => 
        Math.abs(f.x - boatPosition) < 50 && 
        Math.abs(f.y - lineEndY) < 50
      );
      
      if (nearbyFish) {
        setFish(prev => prev.filter(f => f.id !== nearbyFish.id));
        setTimingGame({
          isActive: true,
          fish: nearbyFish,
          progress: 0,
          targetZone: { 
            start: 50 + Math.random() * 20, 
            end: 70 + Math.random() * 20 
          },
          success: false,
        });
        animateTimingGame();
      }
      
      // Start retracting line
      setTimeout(() => {
        setFishingLine(prev => ({ ...prev, isRetracting: true }));
      }, 500);
    }
  };

  // Fishing line animation
  useEffect(() => {
    if (!gameState.isPlaying) return;
    
    const interval = setInterval(() => {
      if (fishingLine.isExtending && fishingLine.length < 350) {
        setFishingLine(prev => ({ ...prev, length: prev.length + 8 }));
      } else if (fishingLine.isRetracting && fishingLine.length > 0) {
        setFishingLine(prev => ({ ...prev, length: prev.length - 12 }));
      } else if (fishingLine.isRetracting && fishingLine.length <= 0) {
        setFishingLine({ length: 0, isExtending: false, isRetracting: false });
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [gameState.isPlaying, fishingLine.isExtending, fishingLine.isRetracting, fishingLine.length]);

  // Timer countdown
  useEffect(() => {
    if (gameState.isPlaying && gameState.timer > 0) {
      const interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timer: prev.timer - 1,
        }));
      }, 1000);
      return () => clearInterval(interval);
    } else if (gameState.timer === 0) {
      setGameState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [gameState.isPlaying, gameState.timer]);

  // Enhanced keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isPlaying || timingGame.isActive) return;
      
      if (e.key === 'ArrowLeft' && boatPosition > 80) {
        setBoatPosition(prev => prev - 15);
      } else if (e.key === 'ArrowRight' && boatPosition < 720) {
        setBoatPosition(prev => prev + 15);
      } else if (e.key === ' ' && !isSpacePressed) {
        e.preventDefault();
        setIsSpacePressed(true);
        handleFishingLineControl();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, boatPosition, timingGame.isActive, isSpacePressed, fishingLine, fish]);

  // Cleanup animations
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timingRef.current) {
        cancelAnimationFrame(timingRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-screen relative overflow-hidden bg-gradient-to-b from-sky-200 via-sky-300 to-blue-400">
      {/* Clouds */}
      <div className="absolute top-4 left-10 w-20 h-12 bg-white rounded-full opacity-80"></div>
      <div className="absolute top-8 right-20 w-32 h-16 bg-white rounded-full opacity-80"></div>
      <div className="absolute top-12 left-1/2 w-24 h-14 bg-white rounded-full opacity-80"></div>
      
      {/* Game UI */}
      <div className="absolute top-4 left-4 flex gap-4 z-10">
        <Card className="p-3 bg-black/80 text-white border-none">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm">{formatTime(gameState.timer)}</span>
          </div>
        </Card>
        
        <Card className="p-3 bg-black/80 text-white border-none">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="font-mono text-sm">${gameState.money}</span>
          </div>
        </Card>
        
        <Card className="p-3 bg-black/80 text-white border-none">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4" />
            <span className="text-sm">Fish: {gameState.fishCaught}</span>
          </div>
        </Card>
      </div>

      {/* Fishing Instructions */}
      {gameState.isPlaying && (
        <div className="absolute top-4 right-4 z-10">
          <Card className="p-3 bg-black/80 text-white border-none">
            <div className="text-sm space-y-1">
              <p>⬅️➡️ Déplacer le bateau</p>
              <p>🎯 [ESPACE] Contrôler le fil</p>
              <p>Ligne: {fishingLine.length.toFixed(0)}m</p>
            </div>
          </Card>
        </div>
      )}

      {/* Timing Game UI */}
      <AnimatePresence>
        {timingGame.isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <Card className="p-6 bg-white/95 backdrop-blur-sm border-2 border-blue-500">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-blue-800">🎣 Poisson Accroché!</h3>
                <p className="text-sm text-gray-600">Cliquez dans la zone verte!</p>
              </div>
              
              <div className="relative w-64 h-6 bg-gray-200 rounded-full mb-4">
                <div 
                  className="absolute top-0 left-0 h-full bg-green-500 rounded-full opacity-50"
                  style={{ 
                    left: `${timingGame.targetZone.start}%`,
                    width: `${timingGame.targetZone.end - timingGame.targetZone.start}%`
                  }}
                />
                <div 
                  className="absolute top-0 w-2 h-full bg-red-500 rounded-full transition-all duration-75"
                  style={{ left: `${timingGame.progress}%` }}
                />
              </div>
              
              <Button 
                onClick={handleTimingClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                ATTRAPER! 🐟
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Area */}
      <div 
        ref={gameAreaRef}
        className="w-full h-full relative"
      >
        {/* Water Surface */}
        <div className="absolute top-52 w-full h-1 bg-blue-300 opacity-60 shadow-lg"></div>
        
        {/* Enhanced Boat Design */}
        <motion.div
          className="absolute top-44 z-20"
          style={{ left: boatPosition - 40 }}
          animate={{ 
            y: [0, -3, 0, -2, 0],
            rotateZ: [0, 1, 0, -1, 0] 
          }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          {/* Boat hull */}
          <div className="relative w-20 h-16">
            {/* Main boat body */}
            <div className="absolute bottom-0 w-20 h-10 bg-gradient-to-b from-amber-700 to-amber-800 rounded-b-3xl border-2 border-amber-900"></div>
            
            {/* Boat deck */}
            <div className="absolute bottom-8 left-2 w-16 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-lg border border-amber-800"></div>
            
            {/* Mast */}
            <div className="absolute bottom-12 left-1/2 w-1 h-8 bg-amber-900 transform -translate-x-1/2"></div>
            
            {/* Character */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="w-6 h-6 bg-orange-600 rounded-full">
                <div className="w-4 h-4 bg-orange-800 rounded-full mx-auto mt-1"></div>
              </div>
              <div className="w-4 h-3 bg-blue-600 rounded-sm mx-auto -mt-1"></div>
            </div>
            
            {/* Fishing rod */}
            <div 
              className="absolute bottom-4 left-1/2 w-0.5 h-6 bg-amber-900 transform -translate-x-1/2 origin-bottom"
              style={{ transform: 'translateX(-50%) rotate(15deg)' }}
            ></div>
          </div>
        </motion.div>

        {/* Fishing Line - user controlled */}
        {fishingLine.length > 0 && (
          <div
            className="absolute w-0.5 bg-gray-800 z-10"
            style={{
              left: boatPosition + 8,
              top: 220,
              height: fishingLine.length,
              transformOrigin: 'top',
            }}
          />
        )}

        {/* Fishing Line Hook */}
        {fishingLine.length > 0 && (
          <div
            className="absolute w-3 h-3 bg-silver-500 rounded-full border-2 border-gray-600 z-10"
            style={{
              left: boatPosition + 6,
              top: 220 + fishingLine.length,
            }}
          />
        )}

        {/* Caught Fish Animation */}
        <AnimatePresence>
          {caughtFish && (
            <motion.div
              className="absolute z-20 text-2xl font-bold text-green-400 drop-shadow-lg"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1, y: -60 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{ left: boatPosition - 20, top: 180 }}
            >
              +${caughtFish.value} 🐟
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Underwater Scene */}
        <div className="absolute top-52 w-full h-full bg-gradient-to-b from-blue-300 via-blue-500 to-blue-800">
          
          {/* Enhanced Fish with better swimming */}
          {fish.map((f) => (
            <motion.div
              key={f.id}
              className="absolute rounded-full shadow-lg"
              style={{
                left: f.x,
                top: f.y,
                width: f.size,
                height: f.size * 0.7,
                backgroundColor: f.color,
                transform: `scaleX(${f.directionX}) rotate(${Math.sin(f.swimAngle) * 10}deg)`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            >
              {/* Enhanced fish tail */}
              <div 
                className="absolute rounded-full"
                style={{
                  backgroundColor: f.color,
                  width: f.size * 0.3,
                  height: f.size * 0.5,
                  left: f.directionX > 0 ? -f.size * 0.2 : f.size * 0.9,
                  top: '25%',
                  clipPath: 'polygon(0% 50%, 100% 0%, 100% 100%)',
                }}
              />
              {/* Fish eye */}
              <div 
                className="absolute w-2 h-2 bg-white rounded-full"
                style={{
                  left: f.directionX > 0 ? f.size * 0.7 : f.size * 0.1,
                  top: '25%',
                }}
              >
                <div className="w-1 h-1 bg-black rounded-full m-0.5"></div>
              </div>
              {/* Fish fins */}
              <div 
                className="absolute rounded-full opacity-80"
                style={{
                  backgroundColor: f.color,
                  width: f.size * 0.2,
                  height: f.size * 0.3,
                  left: f.directionX > 0 ? f.size * 0.3 : f.size * 0.5,
                  top: '60%',
                }}
              />
            </motion.div>
          ))}

          {/* Enhanced underwater environment */}
          <div className="absolute bottom-0 left-10 w-2 h-20 bg-gradient-to-t from-green-800 to-green-600 rounded-t-full"></div>
          <div className="absolute bottom-0 left-32 w-2 h-16 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full"></div>
          <div className="absolute bottom-0 right-20 w-2 h-24 bg-gradient-to-t from-green-800 to-green-600 rounded-t-full"></div>
          <div className="absolute bottom-0 right-40 w-2 h-18 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full"></div>
          
          {/* Bubbles */}
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-blue-100 rounded-full opacity-60 animate-bounce"></div>
          <div className="absolute bottom-32 right-1/3 w-1 h-1 bg-blue-100 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-28 left-2/3 w-1.5 h-1.5 bg-blue-100 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1s' }}></div>
          
          {/* Ocean floor */}
          <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-amber-800 to-amber-600"></div>
          
          {/* Rocks */}
          <div className="absolute bottom-0 left-1/4 w-8 h-4 bg-gray-600 rounded-t-lg"></div>
          <div className="absolute bottom-0 right-1/4 w-6 h-3 bg-gray-700 rounded-t-lg"></div>
        </div>
      </div>

      {/* Start/Game Over Screen */}
      {!gameState.isPlaying && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-8 text-center bg-white/95 backdrop-blur-sm border-2 border-blue-500">
            <h1 className="text-3xl font-bold mb-4 text-blue-800">
              {gameState.timer === 0 ? 'Game Over!' : 'Jeu de Pêche Pro'}
            </h1>
            
            {gameState.timer === 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-lg">Score Final: ${gameState.money}</p>
                <p className="text-sm">Poissons Attrapés: {gameState.fishCaught}</p>
              </div>
            )}
            
            <div className="mb-4 text-sm text-gray-600 space-y-1">
              <p>⬅️➡️ Flèches pour déplacer le bateau</p>
              <p>🎯 [ESPACE] pour contrôler le fil de pêche</p>
              <p>🐟 Cliquez au bon moment pour attraper!</p>
            </div>
            
            <Button 
              onClick={startGame}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3"
            >
              {gameState.timer === 0 ? 'Rejouer' : 'Commencer'} 🎣
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}