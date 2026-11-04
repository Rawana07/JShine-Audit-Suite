import React from 'react';
import { Bell, CheckCheck, Clock, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SystemNotification } from '../../types/erp';
import { formatDateIndian } from '../../utils/rules';

interface NotificationsViewProps {
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkAllRead,
  onMarkRead,
}) => {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System & Operational Alerts</h2>
          <p className="text-xs text-slate-500">
            Real-time event notifications for attendance approvals, client receipts, vendor bills and deadlines.
          </p>
        </div>

        <button
          type="button"
          onClick={onMarkAllRead}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>Mark All as Read</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No active notifications</div>
        ) : (
          notifications.map((n) => {
            const isUnread = !n.read;
            return (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-4 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-start justify-between gap-4 ${
                  isUnread ? 'bg-slate-50/70' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                      n.type === 'success'
                        ? 'bg-emerald-100 text-emerald-700'
                        : n.type === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : n.type === 'alert'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {n.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                    {n.type === 'warning' && <Clock className="w-4 h-4" />}
                    {n.type === 'alert' && <AlertTriangle className="w-4 h-4" />}
                    {n.type === 'info' && <Info className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <span>{n.title}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-slate-950 inline-block"></span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1.5">
                      {formatDateIndian(n.createdAt)} • Event Broadcast
                    </div>
                  </div>
                </div>

                {isUnread && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded shrink-0">
                    Unread
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
