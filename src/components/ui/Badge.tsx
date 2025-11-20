import { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'red' | 'green' | 'yellow' | 'gray' | 'gold' | 'purple';
  className?: string;
}

const Badge = ({ children, variant = 'blue', className = '' }: BadgeProps) => {
  const variantClasses = {
    blue: 'bg-police-blue bg-opacity-10 text-police-blue dark:bg-police-blue-dark dark:bg-opacity-30 dark:text-police-blue-light',
    red: 'bg-police-accent-red bg-opacity-10 text-police-accent-red dark:bg-opacity-30 dark:text-red-300',
    green: 'bg-green-500 bg-opacity-10 text-green-600 dark:bg-opacity-30 dark:text-green-300',
    yellow: 'bg-yellow-400 bg-opacity-10 text-yellow-700 dark:bg-opacity-30 dark:text-yellow-300',
    gray: 'bg-police-gray bg-opacity-30 text-police-gray-dark dark:bg-police-gray-dark dark:bg-opacity-30 dark:text-police-gray-light',
    gold: 'bg-police-accent-gold bg-opacity-10 text-police-accent-gold dark:bg-opacity-30 dark:text-yellow-300',
    purple: 'bg-purple-500 bg-opacity-10 text-purple-600 dark:bg-opacity-30 dark:text-purple-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
