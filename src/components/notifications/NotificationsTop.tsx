import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell } from 'lucide-react';
import { createPortal } from 'react-dom';

export const NotificationsTop = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const fetchNotifications = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) { setNotifications([]); setUnread(0); return; }
      // fetch persistent notifications
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      const dbNotifications = data ?? [];

      // determine if current user is admin (so they can see all incomplete profiles)
      let isAdmin = false;
      try {
        const { data: prof } = await supabase.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
        if (prof && (prof as any).is_admin) isAdmin = true;
      } catch (e) { /* ignore */ }

      // fetch customers/vendors with missing phone (considered incomplete)
      const incomplete: any[] = [];
      try {
        let cusQ = supabase.from('customers').select('id,name,phone,created_by').order('created_at', { ascending: false });
        let venQ = supabase.from('vendors').select('id,name,phone,created_by').order('created_at', { ascending: false });
        if (!isAdmin) {
          cusQ = cusQ.eq('created_by', userId);
          venQ = venQ.eq('created_by', userId);
        }
        const [{ data: customers }, { data: vendors }] = await Promise.all([cusQ, venQ]);
        (customers ?? []).forEach((c: any) => {
          if (!c) return;
          const name = (c.name || '').toString().trim();
          const phone = (c.phone || '').toString().trim();
          // consider incomplete if name or phone is missing
          if (!name || !phone) {
            incomplete.push({ id: `customer:${c.id}`, user_id: userId, type: 'customer', title: 'Incomplete customer profile', message: `Customer "${c.name || '(no name)'}" is missing ${!name ? 'a name' : ''}${!name && !phone ? ' and ' : ''}${!phone ? 'a phone number' : ''} — please complete the profile.`, is_read: false, synthetic: true, entityId: c.id });
          }
        });
        (vendors ?? []).forEach((v: any) => {
          if (!v) return;
          const name = (v.name || '').toString().trim();
          const phone = (v.phone || '').toString().trim();
          // consider incomplete if name or phone is missing
          if (!name || !phone) {
            incomplete.push({ id: `vendor:${v.id}`, user_id: userId, type: 'vendor', title: 'Incomplete vendor profile', message: `Vendor "${v.name || '(no name)'}" is missing ${!name ? 'a name' : ''}${!name && !phone ? ' and ' : ''}${!phone ? 'a phone number' : ''} — please complete the profile.`, is_read: false, synthetic: true, entityId: v.id });
          }
        });
      } catch (e) {
        console.debug('fetch incomplete profiles failed', e);
      }

      // merge synthetic incomplete-profile notifications before persistent ones, dedupe by id
      const map = new Map<string, any>();
      incomplete.forEach(n => map.set(n.id, n));
      (dbNotifications || []).forEach((n: any) => { if (!map.has(n.id)) map.set(n.id, n); });
      const merged = Array.from(map.values()).slice(0, 50);

      setNotifications(merged);
      setUnread(merged.filter(n => !n.is_read).length || 0);
    } catch (e) {
      console.debug('fetchNotifications top failed', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener('notifications:updated', handler);
    return () => window.removeEventListener('notifications:updated', handler);
  }, []);

  useEffect(() => {
    const onDocClick = (ev: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(ev.target as Node)) setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey); };
  }, []);

  // position calculation for portal dropdown
  useEffect(() => {
    const calc = () => {
      const btn = buttonRef.current;
      if (!btn) return setDropdownPos(null);
      const rect = btn.getBoundingClientRect();
      const width = 320; // match w-80
      // align right edge of dropdown with button's right edge if possible
      let left = rect.right - width;
      // ensure it doesn't go offscreen
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      const top = rect.bottom + 8;
      setDropdownPos({ top, left, width });
    };
    if (open) calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('scroll', calc, true); };
  }, [open]);

  return (
    <div className="relative inline-block" ref={wrapperRef}>
      <button ref={buttonRef} aria-haspopup="true" aria-expanded={open} className="p-2 rounded-md hover:bg-accent relative" onClick={() => { setOpen(o => { const next = !o; if (next) fetchNotifications(); return next; }); }}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-semibold px-1.5 py-0.5">{unread}</span>}
      </button>
      {open && dropdownPos && createPortal(
        <div role="dialog" aria-modal="false" style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 2147483647, pointerEvents: 'auto' }}>
          <div className="bg-white rounded-lg shadow-lg p-2">
            <div className="text-xs text-muted-foreground px-2 pb-2">Notifications</div>
            <div className="max-h-64 overflow-auto">
              {notifications.length === 0 && <div className="p-2 text-sm text-muted-foreground">No notifications</div>}
              {notifications.map((n: any, idx: number) => (
                <div key={n.id || idx} className={`p-2 hover:bg-accent/10 cursor-pointer rounded ${n.is_read ? '' : 'bg-accent/5'}`} onClick={async () => {
                  try {
                    if (!n.is_read) await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                    window.dispatchEvent(new CustomEvent('notifications:updated'));
                  } catch (err) { console.debug('mark read failed', err); }
                  setOpen(false);
                  if (n.type === 'vendor') window.location.href = '/vendors';
                  else if (n.type === 'customer') window.location.href = '/customers';
                }}>
                  <div className="font-medium text-sm">{n.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{n.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
};
