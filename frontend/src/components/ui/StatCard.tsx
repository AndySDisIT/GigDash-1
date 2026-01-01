import React, { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  iconBg?: 'primary' | 'success' | 'warning' | 'danger';
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  className?: string;
  animateValue?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last week',
  icon,
  iconBg = 'primary',
  trend = 'neutral',
  loading = false,
  className = '',
  animateValue = true,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  // Animate number counting
  useEffect(() => {
    if (!animateValue || typeof value !== 'number') return;

    let start = 0;
    const end = value;
    const duration = 1000; // 1 second
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, animateValue]);

  const iconBgClasses = {
    primary: 'gradient-primary',
    success: 'gradient-success',
    warning: 'gradient-warning',
    danger: 'gradient-danger',
  };

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
    neutral: null,
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  if (loading) {
    return (
      <div className={`glass-card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-white/10 rounded w-1/3"></div>
            <div className="h-10 w-10 bg-white/10 rounded-lg"></div>
          </div>
          <div className="h-8 bg-white/10 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={`glass-card glass-card-hover p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wide">
          {title}
        </h3>
        {icon && (
          <div className={`p-3 rounded-lg ${iconBgClasses[iconBg]} shadow-glow`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        )}
      </div>

      <div className="mb-2">
        <motion.div
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {animateValue && typeof value === 'number' ? displayValue.toLocaleString() : value}
        </motion.div>
      </div>

      {change !== undefined && (
        <div className="flex items-center text-sm">
          <span className={`flex items-center font-medium ${trendColors[trend]}`}>
            {trendIcons[trend]}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change}%
            </span>
          </span>
          <span className="ml-2 text-gray-400">{changeLabel}</span>
        </div>
      )}
    </motion.div>
  );
};

interface StatGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export const StatGrid: React.FC<StatGridProps> = ({
  children,
  columns = 3,
  gap = 6,
  className = '',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};
