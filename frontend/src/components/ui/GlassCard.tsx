import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'light' | 'strong';
  hover?: boolean;
  animate?: boolean;
  gradient?: 'primary' | 'success' | 'warning' | 'danger' | 'none';
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = true,
  animate = true,
  gradient = 'none',
  onClick,
}) => {
  const baseClass = variant === 'light' 
    ? 'glass-card-light' 
    : variant === 'strong'
    ? 'glass-card-strong'
    : 'glass-card';
  
  const hoverClass = hover ? 'glass-card-hover' : '';
  const interactiveClass = onClick ? 'cursor-pointer' : '';
  
  const gradientOverlay = gradient !== 'none' && (
    <div 
      className={`absolute inset-0 opacity-10 rounded-lg pointer-events-none gradient-${gradient}`}
      style={{ zIndex: 0 }}
    />
  );

  const cardContent = (
    <div 
      className={`${baseClass} ${hoverClass} ${interactiveClass} ${className} relative overflow-hidden`}
      onClick={onClick}
    >
      {gradientOverlay}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

interface GlassCardHeaderProps {
  children: ReactNode;
  className?: string;
}

export const GlassCardHeader: React.FC<GlassCardHeaderProps> = ({ children, className = '' }) => (
  <div className={`p-6 border-b border-white/10 ${className}`}>
    {children}
  </div>
);

interface GlassCardBodyProps {
  children: ReactNode;
  className?: string;
}

export const GlassCardBody: React.FC<GlassCardBodyProps> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

interface GlassCardFooterProps {
  children: ReactNode;
  className?: string;
}

export const GlassCardFooter: React.FC<GlassCardFooterProps> = ({ children, className = '' }) => (
  <div className={`p-6 border-t border-white/10 ${className}`}>
    {children}
  </div>
);
