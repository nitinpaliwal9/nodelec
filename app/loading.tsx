'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-20 h-4" />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-16 h-4" />
            </div>
            <Skeleton className="w-32 h-8 rounded-md" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-12"
        >
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <Skeleton className="w-96 h-12 mx-auto" />
            <Skeleton className="w-128 h-6 mx-auto" />
            <div className="flex gap-4 justify-center">
              <Skeleton className="w-40 h-12 rounded-lg" />
              <Skeleton className="w-40 h-12 rounded-lg" />
            </div>
          </div>

          {/* Content Blocks */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-4"
              >
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="w-32 h-6" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-3/4 h-4" />
                <Skeleton className="w-20 h-8 rounded-md" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}