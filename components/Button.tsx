import React from 'react';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', fullWidth = false, isLoading = false, ...props }) => {
  const baseClasses = "px-6 py-2.5 text-base font-semibold rounded-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1C232E] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  
  const variantClasses = {
    primary: "bg-[#B858FE] text-black font-bold hover:bg-[#a048e0] focus:ring-[#B858FE]",
    secondary: "bg-[#15333B]/50 text-gray-200 hover:bg-[#15333B]/80 border border-[#15A4A2] focus:ring-[#15A4A2]",
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass}`}
      {...props}
      disabled={props.disabled || isLoading}
    >
      {isLoading ? <Spinner /> : children}
    </button>
  );
};

export default Button;