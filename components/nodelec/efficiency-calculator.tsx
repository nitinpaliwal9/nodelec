'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function EfficiencyCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [bomCount, setBomCount] = useState(10);
  const [timePerBom, setTimePerBom] = useState(45);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const manualTimePerBom = 45; // minutes
  const automatedTimePerBom = 2.5; // minutes (42 seconds)
  const timeSavedPerBom = manualTimePerBom - automatedTimePerBom;
  const totalTimeSaved = timeSavedPerBom * bomCount;
  const hoursPerWeek = (totalTimeSaved * 5) / 60; // Assuming 5 working days
  const costSavingsPerYear = hoursPerWeek * 52 * 75; // Assuming $75/hour rate

  if (!mounted) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-40 p-4 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/30 group"
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-primary group-hover:text-primary">
              Calc
            </span>
            <ChevronDown
              size={16}
              className="text-primary transition-transform duration-300"
              style={{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>
        </div>

        {/* Pulsing glow effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 animate-pulse"></div>
      </button>

      {/* Calculator panel */}
      <div
        className={`fixed bottom-24 right-8 z-40 w-80 rounded-2xl backdrop-blur-md bg-card/80 border border-primary/30 shadow-2xl shadow-primary/20 transition-all duration-300 overflow-hidden ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header with glow */}
        <div className="relative p-6 border-b border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
          <h3 className="relative text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            Efficiency Calculator
          </h3>
          <p className="relative text-xs text-primary/60 mt-1">
            See your ROI instantly
          </p>
        </div>

        {/* Calculator content */}
        <div className="p-6 space-y-6">
          {/* BOMs per month input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white flex justify-between">
              <span>BOMs per Month</span>
              <span className="text-primary font-bold">{bomCount}</span>
            </label>
            <input
              type="range"
              min="1"
              max="500"
              value={bomCount}
              onChange={(e) => setBomCount(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>250</span>
              <span>500</span>
            </div>
          </div>

          {/* Results Grid */}
          <div className="space-y-3 pt-4 border-t border-primary/20">
            {/* Time saved per BOM */}
            <div className="bg-secondary/50 rounded-lg p-3 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Time Saved Per BOM</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {timeSavedPerBom.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>

            {/* Daily savings */}
            <div className="bg-secondary/50 rounded-lg p-3 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">Monthly Time Saved</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  {(totalTimeSaved / 60).toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </div>

            {/* Annual cost savings */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-3 border border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">Annual Cost Savings</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  ${costSavingsPerYear.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-primary/70">/year</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-primary/20">
            <div className="bg-secondary/30 rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Manual vs Auto</p>
              <p className="text-sm font-bold text-primary">
                {(manualTimePerBom / automatedTimePerBom).toFixed(0)}x faster
              </p>
            </div>
            <div className="bg-secondary/30 rounded p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Hours/Week Saved</p>
              <p className="text-sm font-bold text-primary">
                {hoursPerWeek.toFixed(1)}h
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full mt-4 bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/90 text-background font-semibold py-2 px-4 rounded-lg transition-all duration-300 text-sm hover:shadow-lg hover:shadow-primary/40">
            Request Demo
          </button>
        </div>

        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-primary/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
          animation: 'borderPulse 3s infinite'
        }}></div>
      </div>

      <style jsx>{`
        @keyframes borderPulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </>
  );
}
