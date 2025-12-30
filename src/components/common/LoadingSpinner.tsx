interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'medium',
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className={`spinner ${sizeClasses[size]}`} />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        {spinner}
        {text && <div className="text-gray-500 text-sm mt-4">{text}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {spinner}
      {text && <div className="text-gray-500 text-sm mt-4">{text}</div>}
    </div>
  );
}
