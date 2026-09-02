'use client';

import React from 'react';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function PageContainer({
  children,
  className = '',
  fullWidth = false,
}: PageContainerProps) {
  return (
    <div
      className={`w-full ${
        fullWidth ? 'max-w-full' : 'max-w-7xl'
      } mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-24 md:pb-8 ${className}`}
    >
      {children}
    </div>
  );
}
