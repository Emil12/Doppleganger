import { useEffect, useRef, useState, type FormEvent } from 'react';
import { type ChatMessage } from '../lib/multiplayerProtocol';
import './MultiplayerChat.css';

type MultiplayerChatProps = {
  connected: boolean;
  messages: ChatMessage[];
  onSend: (text: string) => boolean;
};

export function MultiplayerChat({ connected, messages, onSend }: MultiplayerChatProps) {
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastSentAt = useRef(0);

  const openChat = () => {
    document.exitPointerLock?.();
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLInputElement
        || event.target instanceof HTMLTextAreaElement;
      if (event.code === 'Enter' && !typing) {
        event.preventDefault();
        openChat();
      }
      if (event.code === 'Escape' && open) {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [open]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const now = Date.now();
    if (now - lastSentAt.current < 500 || !onSend(draft)) return;
    lastSentAt.current = now;
    setDraft('');
  };

  return (
    <aside className={`multiplayer-chat ${open ? 'is-open' : ''}`}>
      <div className="multiplayer-chat__messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && <small>NO MESSAGES YET</small>}
        {messages.map((message) => (
          <p key={message.messageId}>
            <strong>{message.playerName}</strong>
            <span>{message.text}</span>
          </p>
        ))}
      </div>
      {open ? (
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            value={draft}
            maxLength={160}
            placeholder={connected ? 'MESSAGE ROOM…' : 'CONNECTING…'}
            disabled={!connected}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" disabled={!connected || !draft.trim()}>SEND</button>
        </form>
      ) : (
        <button type="button" onClick={openChat}>ENTER · OPEN CHAT</button>
      )}
    </aside>
  );
}
