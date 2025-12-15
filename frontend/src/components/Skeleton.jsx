export default function Skeleton({ className = "" }) {
  return (
    <div 
      className={`animate-pulse bg-gray-200 dark:bg-slate-700/50 rounded-md ${className}`} 
    />
  );
}