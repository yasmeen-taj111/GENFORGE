import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import useResumeStore from '../store/resumeStore';

export const Notifications = () => {
  const { notifications, dismiss } = useNotificationStore();
  const { error, clearError } = useResumeStore();

  useEffect(() => {
    if (!error) return;
    useNotificationStore.getState().notify(error, 'error');
    clearError();
  }, [error, clearError]);

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {notifications.map((notice) => {
        const isError = notice.type === 'error';
        return (
          <div key={notice.id} role="status" className={`flex items-start gap-3 rounded-xl border p-3 shadow-lg ${isError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-white text-slate-800'}`}>
            {isError ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
            <p className="flex-1 text-xs font-medium leading-5">{notice.message}</p>
            <button type="button" onClick={() => dismiss(notice.id)} className="text-slate-400 hover:text-slate-700" aria-label="Dismiss notification"><X className="h-4 w-4" /></button>
          </div>
        );
      })}
    </div>
  );
};
