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

interface FishBite {
  isActive: boolean;
  intensity: number;
  fish: Fish | null;
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
  const [fishBite, setFishBite] = useState<FishBite>({
    isActive: false,
    intensity: 0,
    fish: null,
  });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const timingRef = useRef<number>();
  const biteAnimationRef = useRef<number>();

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

  // Fish bite animation
  const animateFishBite = useCallback(() => {
    if (!fishBite.isActive) return;
    
    setFishBite(prev => {
      const newIntensity = Math.sin(Date.now() * 0.02) * 10 + 10;
      return { ...prev, intensity: newIntensity };
    });
    
    biteAnimationRef.current = requestAnimationFrame(animateFishBite);
  }, [fishBite.isActive]);

  // Start fish bite animation
  useEffect(() => {
    if (fishBite.isActive) {
      biteAnimationRef.current = requestAnimationFrame(animateFishBite);
    }
    return () => {
      if (biteAnimationRef.current) {
        cancelAnimationFrame(biteAnimationRef.current);
      }
    };
  }, [fishBite.isActive, animateFishBite]);

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
    
    // Reset fish bite animation
    setFishBite({ isActive: false, intensity: 0, fish: null });
  };

  // Start game
  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true }));
    setFishingLine({ length: 0, isExtending: false, isRetracting: false });
    setFishBite({ isActive: false, intensity: 0, fish: null });
    generateFish();
  };

  // Handle fishing line control with space bar
  const handleFishingLineControl = () => {
    if (!gameState.isPlaying || timingGame.isActive || fishBite.isActive) return;
    
    if (!fishingLine.isExtending && !fishingLine.isRetracting && fishingLine.length === 0) {
      // Start extending line
      setFishingLine(prev => ({ ...prev, isExtending: true }));
    } else if (fishingLine.isExtending) {
      // Stop extending and check for fish with bite probability based on fish type
      setFishingLine(prev => ({ ...prev, isExtending: false }));
      
      // Check for fish catch with bite probability based on fish type
      const lineEndY = 220 + fishingLine.length;
      const candidateFish = fish.filter(f => 
        Math.abs(f.x - boatPosition) < 50 && 
        Math.abs(f.y - lineEndY) < 50
      );
      
      if (candidateFish.length > 0) {
        // Calculate bite probabilities - small blue fish bite more often
        const fishWithProbability = candidateFish.map(f => ({
          fish: f,
          probability: f.type === 'small' ? 0.8 :    // 80% chance for small blue fish
                      f.type === 'medium' ? 0.6 :   // 60% chance for medium red fish
                      f.type === 'large' ? 0.4 :    // 40% chance for large orange fish
                      0.2                           // 20% chance for big gray sharks
        }));
        
        // Try each fish based on their probability
        const biteAttempts = fishWithProbability.filter(f => Math.random() < f.probability);
        
        if (biteAttempts.length > 0) {
          // Choose the first fish that bites (or random if multiple)
          const nearbyFish = biteAttempts[Math.floor(Math.random() * biteAttempts.length)].fish;
          
          // Start fish bite animation
          setFishBite({
            isActive: true,
            intensity: 0,
            fish: nearbyFish,
          });
          
          // Remove fish from water
          setFish(prev => prev.filter(f => f.id !== nearbyFish.id));
          
          // Show bite animation for 2 seconds, then start timing game
          setTimeout(() => {
            setFishBite({ isActive: false, intensity: 0, fish: null });
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
          }, 2000);
        } else {
          // No fish bit, start retracting line
          setTimeout(() => {
            setFishingLine(prev => ({ ...prev, isRetracting: true }));
          }, 500);
        }
      } else {
        // No fish nearby, start retracting line
        setTimeout(() => {
          setFishingLine(prev => ({ ...prev, isRetracting: true }));
        }, 500);
      }
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
      if (biteAnimationRef.current) {
        cancelAnimationFrame(biteAnimationRef.current);
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
              {fishBite.isActive && (
                <p className="text-yellow-400 animate-pulse">🐟 Un poisson mord!</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Fish Bite Alert */}
      <AnimatePresence>
        {fishBite.isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
          >
            <Card className="p-6 bg-yellow-400/95 backdrop-blur-sm border-2 border-yellow-600">
              <div className="text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0] 
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-4xl mb-2"
                >
                  🎣
                </motion.div>
                <h3 className="text-xl font-bold text-yellow-900 mb-2">
                  Un poisson mord!
                </h3>
                <p className="text-sm text-yellow-800">
                  Préparez-vous à l'attraper...
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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

        {/* Fishing Line - user controlled with bite animation */}
        {fishingLine.length > 0 && (
          <motion.div
            className="absolute w-0.5 bg-gray-800 z-10"
            style={{
              left: boatPosition + 8,
              top: 220,
              height: fishingLine.length,
              transformOrigin: 'top',
            }}
            animate={fishBite.isActive ? {
              x: [0, fishBite.intensity * 0.5, -fishBite.intensity * 0.5, 0],
              scaleX: [1, 1.1, 0.9, 1],
            } : {}}
            transition={{ duration: 0.1, repeat: fishBite.isActive ? Infinity : 0 }}
          />
        )}

        {/* Fishing Line Hook with bite animation */}
        {fishingLine.length > 0 && (
          <motion.div
            className="absolute w-3 h-3 bg-silver-500 rounded-full border-2 border-gray-600 z-10"
            style={{
              left: boatPosition + 6,
              top: 220 + fishingLine.length,
            }}
            animate={fishBite.isActive ? {
              x: [0, fishBite.intensity, -fishBite.intensity, 0],
              y: [0, fishBite.intensity * 0.3, -fishBite.intensity * 0.3, 0],
              scale: [1, 1.2, 0.8, 1],
            } : {}}
            transition={{ duration: 0.1, repeat: fishBite.isActive ? Infinity : 0 }}
          />
        )}

        {/* Water Ripples when fish bites */}
        {fishBite.isActive && (
          <motion.div
            className="absolute z-10"
            style={{
              left: boatPosition - 20,
              top: 220 + fishingLine.length - 20,
              width: 40,
              height: 40,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              scale: [0.5, 2, 3],
            }}
            transition={{ 
              duration: 1, 
              repeat: Infinity,
              ease: "easeOut"
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-blue-300 opacity-60"></div>
          </motion.div>
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

        {/* Enhanced Underwater Scene with Rich Marine Vegetation */}
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

          {/* Rich Marine Vegetation */}
          
          {/* Tall Kelp Forest */}
          <motion.div 
            className="absolute bottom-0 left-16 w-4 h-32 bg-gradient-to-t from-green-900 via-green-700 to-green-500 rounded-t-full"
            animate={{ 
              rotateZ: [0, 3, -3, 0],
              scaleY: [1, 1.05, 0.95, 1] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-20 w-3 h-28 bg-gradient-to-t from-green-800 via-green-600 to-green-400 rounded-t-full"
            animate={{ 
              rotateZ: [0, -2, 4, 0],
              scaleY: [1, 0.95, 1.05, 1] 
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-12 w-2 h-24 bg-gradient-to-t from-green-800 to-green-600 rounded-t-full"
            animate={{ 
              rotateZ: [0, 2, -2, 0] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Medium Kelp */}
          <motion.div 
            className="absolute bottom-0 left-64 w-3 h-20 bg-gradient-to-t from-green-900 to-green-600 rounded-t-full"
            animate={{ 
              rotateZ: [0, -3, 3, 0] 
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-68 w-2 h-16 bg-gradient-to-t from-green-800 to-green-500 rounded-t-full"
            animate={{ 
              rotateZ: [0, 4, -2, 0] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Right Side Kelp Forest */}
          <motion.div 
            className="absolute bottom-0 right-32 w-4 h-36 bg-gradient-to-t from-green-900 via-green-700 to-green-500 rounded-t-full"
            animate={{ 
              rotateZ: [0, -4, 4, 0],
              scaleY: [1, 1.08, 0.92, 1] 
            }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-28 w-3 h-30 bg-gradient-to-t from-green-800 to-green-600 rounded-t-full"
            animate={{ 
              rotateZ: [0, 3, -3, 0] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-24 w-2 h-22 bg-gradient-to-t from-green-800 to-green-500 rounded-t-full"
            animate={{ 
              rotateZ: [0, -2, 2, 0] 
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Smaller Seaweed */}
          <motion.div 
            className="absolute bottom-0 left-80 w-2 h-12 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full"
            animate={{ 
              rotateZ: [0, 5, -5, 0] 
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 left-120 w-1.5 h-8 bg-gradient-to-t from-green-600 to-green-400 rounded-t-full"
            animate={{ 
              rotateZ: [0, -3, 3, 0] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-0 right-80 w-2 h-14 bg-gradient-to-t from-green-700 to-green-500 rounded-t-full"
            animate={{ 
              rotateZ: [0, 4, -4, 0] 
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Colorful Coral Formations */}
          <div className="absolute bottom-0 left-40 w-8 h-6 bg-gradient-to-t from-pink-700 to-pink-500 rounded-t-lg">
            <div className="absolute top-0 left-1 w-2 h-3 bg-pink-400 rounded-full"></div>
            <div className="absolute top-0 right-1 w-2 h-4 bg-pink-600 rounded-full"></div>
            <div className="absolute -top-1 left-3 w-3 h-2 bg-pink-500 rounded-full"></div>
          </div>
          
          <div className="absolute bottom-0 right-60 w-10 h-8 bg-gradient-to-t from-orange-700 to-orange-500 rounded-t-lg">
            <div className="absolute top-0 left-1 w-2 h-4 bg-orange-400 rounded-full"></div>
            <div className="absolute top-0 right-2 w-3 h-3 bg-orange-600 rounded-full"></div>
            <div className="absolute -top-1 left-4 w-2 h-3 bg-orange-500 rounded-full"></div>
          </div>
          
          {/* Sea Anemones */}
          <motion.div 
            className="absolute bottom-0 left-100 w-6 h-4 bg-gradient-to-t from-purple-800 to-purple-600 rounded-t-full"
            animate={{ 
              scaleX: [1, 1.1, 0.9, 1],
              scaleY: [1, 0.9, 1.1, 1] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute top-0 left-0 w-1 h-2 bg-purple-400 rounded-full"></div>
            <div className="absolute top-0 left-1 w-1 h-3 bg-purple-300 rounded-full"></div>
            <div className="absolute top-0 right-1 w-1 h-2 bg-purple-400 rounded-full"></div>
            <div className="absolute top-0 right-0 w-1 h-2.5 bg-purple-300 rounded-full"></div>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-0 right-100 w-5 h-3 bg-gradient-to-t from-teal-800 to-teal-600 rounded-t-full"
            animate={{ 
              scaleX: [1, 0.9, 1.1, 1],
              scaleY: [1, 1.1, 0.9, 1] 
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute top-0 left-0 w-1 h-1.5 bg-teal-400 rounded-full"></div>
            <div className="absolute top-0 left-1 w-1 h-2 bg-teal-300 rounded-full"></div>
            <div className="absolute top-0 right-1 w-1 h-1.5 bg-teal-400 rounded-full"></div>
          </motion.div>
          
          {/* Additional Rocks and Formations */}
          <div className="absolute bottom-0 left-1/4 w-8 h-4 bg-gray-600 rounded-t-lg">
            <div className="absolute top-0 left-1 w-2 h-1 bg-gray-500 rounded-full"></div>
            <div className="absolute top-0 right-1 w-1 h-2 bg-gray-700 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 right-1/4 w-6 h-3 bg-gray-700 rounded-t-lg">
            <div className="absolute top-0 left-1 w-1 h-1 bg-gray-600 rounded-full"></div>
          </div>
          <div className="absolute bottom-0 left-1/2 w-4 h-2 bg-gray-600 rounded-t-lg"></div>
          
          {/* Enhanced Bubbles */}
          <motion.div 
            className="absolute bottom-20 left-1/4 w-2 h-2 bg-blue-100 rounded-full opacity-60"
            animate={{ 
              y: [0, -100, -200],
              x: [0, 10, -5, 0],
              scale: [1, 1.2, 0.8, 0] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute bottom-32 right-1/3 w-1 h-1 bg-blue-100 rounded-full opacity-60"
            animate={{ 
              y: [0, -120, -240],
              x: [0, -8, 12, 0],
              scale: [1, 1.3, 0.7, 0] 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 1 }}
          />
          <motion.div 
            className="absolute bottom-28 left-2/3 w-1.5 h-1.5 bg-blue-100 rounded-full opacity-60"
            animate={{ 
              y: [0, -80, -160],
              x: [0, 5, -10, 0],
              scale: [1, 1.1, 0.9, 0] 
            }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut", delay: 2 }}
          />
          
          {/* Bubble streams from sea anemones */}
          <motion.div 
            className="absolute bottom-8 left-102 w-1 h-1 bg-blue-200 rounded-full opacity-40"
            animate={{ 
              y: [0, -60, -120],
              scale: [1, 1.5, 0] 
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute bottom-6 right-102 w-0.5 h-0.5 bg-blue-200 rounded-full opacity-40"
            animate={{ 
              y: [0, -40, -80],
              scale: [1, 1.2, 0] 
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
          />
          
          {/* Ocean floor with texture */}
          <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-amber-800 to-amber-600">
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-700 opacity-50"></div>
            <div className="absolute top-2 left-4 w-2 h-1 bg-amber-900 rounded-full"></div>
            <div className="absolute top-1 right-8 w-1 h-1 bg-amber-900 rounded-full"></div>
            <div className="absolute top-2 left-1/2 w-1.5 h-1 bg-amber-900 rounded-full"></div>
            <div className="absolute top-1 right-1/3 w-1 h-1 bg-amber-900 rounded-full"></div>
          </div>
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
              <p className="text-blue-600 font-semibold">💡 Les petits poissons bleus mordent plus souvent!</p>
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