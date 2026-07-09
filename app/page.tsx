'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export default function PomoFlow() {
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'pomodoro' | 'short' | 'long'>('pomodoro');
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Todo states
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('pomoTodos');
    if (savedTodos) setTodos(JSON.parse(savedTodos));
    const savedPomos = localStorage.getItem('pomodorosCompleted');
    if (savedPomos) setPomodorosCompleted(parseInt(savedPomos));
  }, []);

  // Save todos
  useEffect(() => {
    localStorage.setItem('pomoTodos', JSON.stringify(todos));
  }, [todos]);

  // Save pomos
  useEffect(() => {
    localStorage.setItem('pomodorosCompleted', pomodorosCompleted.toString());
  }, [pomodorosCompleted]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (mode === 'pomodoro') {
      const newCount = pomodorosCompleted + 1;
      setPomodorosCompleted(newCount);
      if (newCount % 4 === 0) {
        setMode('long');
        setTimeLeft(15 * 60);
      } else {
        setMode('short');
        setTimeLeft(5 * 60);
      }
    } else {
      setMode('pomodoro');
      setTimeLeft(25 * 60);
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('PomoFlow', { body: mode === 'pomodoro' ? 'Great work! Take a break.' : 'Break done! Time to focus.' });
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    if (Notification.permission === 'default') Notification.requestPermission();
  };

  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
    const times = { pomodoro: 25*60, short: 5*60, long: 15*60 };
    setTimeLeft(times[mode]);
  };

  const changeMode = (newMode: 'pomodoro' | 'short' | 'long') => {
    setMode(newMode);
    setIsRunning(false);
    const times = { pomodoro: 25*60, short: 5*60, long: 15*60 };
    setTimeLeft(times[newMode]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: newTodo.trim(), completed: false }]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(t => t.id === id ? {...t, completed: !t.completed} : t));
  };

  const deleteTodo = (id: string) => setTodos(todos.filter(t => t.id !== id));

  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = todos.filter(t => t.completed).length;
  const progress = mode === 'pomodoro' ? ((25*60 - timeLeft) / (25*60)) * 100 : 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-zinc-800 bg-zinc-900 py-4">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-2xl">🍅</div>
            <h1 className="text-3xl font-bold tracking-tighter">PomoFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-zinc-800 px-4 py-1.5 rounded-full text-sm flex items-center gap-2">
              <span>🔥</span> {pomodorosCompleted} pomos
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-8 p-8">
        {/* Timer */}
        <div className="flex-1 flex flex-col items-center pt-12">
          <div className="flex bg-zinc-900 rounded-2xl p-1 mb-10">
            {(['pomodoro', 'short', 'long'] as const).map(m => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`px-8 py-3 rounded-xl text-sm font-medium transition ${mode === m ? 'bg-white text-black' : 'hover:bg-zinc-800'}`}
              >
                {m === 'pomodoro' ? 'Focus' : m === 'short' ? 'Short Break' : 'Long Break'}
              </button>
            ))}
          </div>

          <div className="relative w-96 h-96">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#27272a" strokeWidth="6"/>
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke={mode === 'pomodoro' ? '#fb923c' : '#4ade80'} 
                strokeWidth="6" 
                strokeDasharray={`${(progress / 100) * 289} 289`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-8xl font-mono font-semibold tabular-nums">{formatTime(timeLeft)}</div>
              <div className="mt-3 uppercase tracking-[3px] text-sm text-zinc-400">{mode.toUpperCase().replace('POMODORO', 'FOCUS')}</div>
            </div>
          </div>

          <div className="flex gap-4 mt-12">
            <button onClick={isRunning ? pauseTimer : startTimer} className="px-12 py-4 rounded-2xl bg-white text-black font-semibold text-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              {isRunning ? '⏸ PAUSE' : '▶ START'}
            </button>
            <button onClick={resetTimer} className="px-8 py-4 rounded-2xl border border-zinc-700 hover:bg-zinc-900 font-medium">RESET</button>
          </div>
        </div>

        {/* Todos */}
        <div className="w-96 bg-zinc-900 rounded-3xl p-6 flex flex-col h-[620px]">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <span className="text-zinc-400 text-sm">{completedCount}/{todos.length}</span>
          </div>

          <form onSubmit={addTodo} className="mb-6">
            <div className="flex">
              <input 
                value={newTodo} 
                onChange={e => setNewTodo(e.target.value)}
                placeholder="Add a task..." 
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-l-2xl px-5 py-3 focus:outline-none focus:border-orange-400"
              />
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 px-8 rounded-r-2xl font-medium">Add</button>
            </div>
          </form>

          <div className="flex gap-px mb-4 bg-zinc-800 p-1 rounded-xl">
            {['all','active','completed'].map(f => (
              <button key={f} onClick={() => setFilter(f as any)} className={`flex-1 py-2 text-xs rounded-xl capitalize ${filter === f ? 'bg-zinc-700' : ''}`}>{f}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredTodos.length === 0 ? (
              <p className="text-center text-zinc-500 py-12">No tasks yet — add some to stay focused!</p>
            ) : filteredTodos.map(todo => (
              <div key={todo.id} className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-4 group">
                <input type="checkbox" checked={todo.completed} onChange={() => toggleTodo(todo.id)} className="accent-orange-500 w-5 h-5" />
                <span className={`flex-1 ${todo.completed ? 'line-through text-zinc-500' : ''}`}>{todo.text}</span>
                <button onClick={() => deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 text-red-400">✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
