'use client'

import { useState, useEffect, useRef } from 'react'

const TIME_OPTIONS = [
  { label: '10', value: 10, unit: 'сек' },
  { label: '20', value: 20, unit: 'сек' },
  { label: '30', value: 30, unit: 'сек' },
  { label: '45', value: 45, unit: 'сек' },
  { label: '60', value: 60, unit: 'сек' },
  { label: '2', value: 120, unit: 'мин' },
  { label: '3', value: 180, unit: 'мин' },
  { label: '5', value: 300, unit: 'мин' },
]

const MUSIC_FILES = [
  '/Если мир — это игра, то где кнопка выход.mp3',
  '/Мне врали в школе, врали в новостях,.mp3',
  '/Это не музыка..mp3',
  '/Если мир — это игра, то где кнопка выход (1).mp3',
  '/Я любил тебя так наивно,.mp3',
  '/Мне врали в школе, врали в новостях, (1).mp3',
]

export default function Home() {
  const [selectedTime, setSelectedTime] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isRunning, setIsRunning] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(MUSIC_FILES[0])
    audioRef.current.loop = false
    audioRef.current.volume = 0.5

    const handleTrackEnd = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_FILES.length)
    }

    audioRef.current.addEventListener('ended', handleTrackEnd)

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleTrackEnd)
        audioRef.current.pause()
        audioRef.current = null
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }
    }
  }, [])

  // Change track when index changes
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused
      audioRef.current.src = MUSIC_FILES[currentTrackIndex]
      if (wasPlaying) {
        audioRef.current.play().then(() => {
          if (audioRef.current) {
            fadeIn(audioRef.current)
          }
        }).catch(err => console.error('Error playing audio:', err))
      }
    }
  }, [currentTrackIndex])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // Fade in audio
  const fadeIn = (audio: HTMLAudioElement, duration: number = 1000) => {
    const targetVolume = 0.5
    const steps = 50
    const stepDuration = duration / steps
    const volumeIncrement = targetVolume / steps

    audio.volume = 0

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current)
    }

    let currentStep = 0
    fadeIntervalRef.current = setInterval(() => {
      currentStep++
      if (currentStep >= steps || audio.volume >= targetVolume) {
        audio.volume = targetVolume
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current)
          fadeIntervalRef.current = null
        }
      } else {
        audio.volume = Math.min(targetVolume, audio.volume + volumeIncrement)
      }
    }, stepDuration)
  }

  // Fade out audio
  const fadeOut = (audio: HTMLAudioElement, duration: number = 1000): Promise<void> => {
    return new Promise((resolve) => {
      const startVolume = audio.volume
      const steps = 50
      const stepDuration = duration / steps
      const volumeDecrement = startVolume / steps

      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current)
      }

      let currentStep = 0
      fadeIntervalRef.current = setInterval(() => {
        currentStep++
        if (currentStep >= steps || audio.volume <= 0) {
          audio.volume = 0
          audio.pause()
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current)
            fadeIntervalRef.current = null
          }
          resolve()
        } else {
          audio.volume = Math.max(0, audio.volume - volumeDecrement)
        }
      }, stepDuration)
    })
  }

  // Control music playback
  useEffect(() => {
    if (audioRef.current) {
      if (isRunning) {
        audioRef.current.play().then(() => {
          if (audioRef.current) {
            fadeIn(audioRef.current)
          }
        }).catch(err => console.error('Error playing audio:', err))
      } else {
        if (!audioRef.current.paused) {
          fadeOut(audioRef.current)
        }
      }
    }
  }, [isRunning])

  // Stop when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false)
    }
  }, [timeLeft, isRunning])

  const handleToggle = () => {
    if (!isRunning) {
      setTimeLeft(selectedTime)
      setIsRunning(true)
    } else {
      setIsRunning(false)
      setTimeLeft(selectedTime)
    }
  }

  const handleTimeSelect = (time: number) => {
    if (!isRunning) {
      setSelectedTime(time)
      setTimeLeft(time)
    }
  }

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_FILES.length)
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950">
      <div className="flex flex-col items-center">
        {/* Time Selector */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-6 text-white/90">
            Квиз Таймер
          </h1>
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-3xl p-1.5 border border-slate-700/50 shadow-2xl inline-flex">
            <div className="flex gap-1">
              {TIME_OPTIONS.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => handleTimeSelect(option.value)}
                  disabled={isRunning}
                  className={`
                    relative overflow-hidden py-4 px-6 font-bold text-lg transition-all duration-300
                    ${index === 0 ? 'rounded-l-2xl' : ''}
                    ${index === TIME_OPTIONS.length - 1 ? 'rounded-r-2xl' : ''}
                    ${
                      selectedTime === option.value
                        ? 'bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-900 shadow-lg scale-[0.98] z-10'
                        : 'bg-transparent text-white/60 hover:bg-slate-700/30 hover:text-white'
                    }
                    ${isRunning ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    active:scale-95
                  `}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-xl font-black">{option.label}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{option.unit}</span>
                  </div>
                  {selectedTime === option.value && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-2xl" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timer Button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleToggle}
            className={`
              relative w-80 h-80 rounded-full transition-all duration-500 cursor-pointer
              ${isRunning
                ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 shadow-2xl shadow-rose-500/40 hover:shadow-rose-500/60'
                : 'bg-gradient-to-br from-emerald-400 via-cyan-400 to-emerald-500 shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60'
              }
              hover:scale-105 active:scale-95 border-[12px] border-white/20
            `}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 via-transparent to-transparent" />
            <div className="absolute inset-0 rounded-full shadow-inner" />
            <div className="relative flex flex-col items-center justify-center h-full">
              <span className="text-7xl font-black text-white mb-3 tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                {isRunning ? formatTime(timeLeft) : formatTime(selectedTime)}
              </span>
              <span className="text-2xl text-white/90 font-bold uppercase tracking-wider" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                {isRunning ? 'Стоп' : 'Старт'}
              </span>
            </div>
          </button>

          {/* Status indicator */}
          {isRunning && (
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-3 bg-slate-800/60 backdrop-blur-xl rounded-full px-8 py-4 border border-emerald-400/30 shadow-lg shadow-emerald-500/20">
                <div className="relative">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
                </div>
                <span className="text-base font-semibold text-emerald-100">
                  Музыка играет
                </span>
              </div>
            </div>
          )}

          {/* Next Track Button */}
          <button
            onClick={handleNextTrack}
            className="mt-4 inline-flex items-center gap-2 bg-slate-800/60 backdrop-blur-xl rounded-full px-6 py-3 border border-slate-700/50 shadow-lg hover:bg-slate-700/60 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm font-semibold text-white/80">
              Следующий трек
            </span>
          </button>
        </div>
      </div>
    </main>
  )
}
