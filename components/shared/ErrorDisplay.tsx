interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="p-8 text-center animate-fade-in">
      <div className="text-4xl mb-4">😵</div>
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
        加载失败
      </h3>
      <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          🔄 重新加载
        </button>
      )}
    </div>
  );
}
