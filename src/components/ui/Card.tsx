import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
  onClick?: () => void;
}

const Card = ({ title, children, className = '', hover = true, animate = true, onClick }: CardProps) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-card p-6';
  const hoverClasses = hover ? 'hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';
  
  const content = (
    <div 
      className={`${baseClasses} ${hoverClasses} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {title && <h2 className="text-lg font-semibold text-police-blue-dark dark:text-police-text-light mb-4">{title}</h2>}
      {children}
    </div>
  );
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    );
  }
  
  return content;
};

export default Card;
