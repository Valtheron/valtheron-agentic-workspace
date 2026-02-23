import { useState, useEffect, useRef, useCallback } from 'react';
import type { Agent, ChatSession, ChatMessage } from '../types';
import { chatAPI } from '../services/api';

interface ChatViewProps {
  agents: Agent[];
}

export default function ChatView({ agents }: ChatViewProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await chatAPI.listSessions();
      setSessions(res.sessions as ChatSession[]);
    } catch {
      // fallback: empty
    }
    setLoading(false);
  };

  // Load messages when session changes
  useEffect(() => {
    if (!selectedSessionId) { setMessages([]); return; }
    loadMessages(selectedSessionId);

    // Poll for new messages every 2 seconds
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadMessages(selectedSessionId);
    }, 2000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedSessionId]);

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await chatAPI.getMessages(sessionId);
      setMessages(res.messages as ChatMessage[]);
    } catch {
      // ignore
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !selectedSessionId || sending) return;
    const text = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic update
    const tempMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sessionId: selectedSessionId,
      sender: 'user',
      senderType: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      await chatAPI.sendMessage(selectedSessionId, text);
      // Reload messages after short delay to get agent response
      setTimeout(() => loadMessages(selectedSessionId), 2000);
      loadSessions(); // refresh session list for updated timestamps
    } catch {
      // remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }
    setSending(false);
    inputRef.current?.focus();
  }, [inputText, selectedSessionId, sending]);

  const handleNewChat = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    try {
      const session = await chatAPI.createSession(agentId, `Chat mit ${agent?.name || 'Agent'}`);
      const newSession = session as ChatSession;
      setSessions(prev => [newSession, ...prev]);
      setSelectedSessionId(newSession.id);
      setShowNewChat(false);
      setAgentSearch('');
    } catch {
      // ignore
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await chatAPI.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  };

  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name ?? id;
  const getAgentCategory = (id: string) => agents.find(a => a.id === id)?.category ?? '';
  const getAgentStatus = (id: string) => agents.find(a => a.id === id)?.status ?? 'idle';

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const filteredAgents = agents.filter(a => {
    const matchSearch = !agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()) || a.category.includes(agentSearch.toLowerCase());
    const matchCat = categoryFilter === 'all' || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = [...new Set(agents.map(a => a.category))].sort();

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Jetzt';
    if (diff < 3600000) return `vor ${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="chat-layout">
      {/* Session List */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <span style={{ fontWeight: 600, fontSize: 13 }}>Konversationen</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewChat(true)}>+ Neuer Chat</button>
        </div>

        {showNewChat && (
          <div className="chat-new-overlay">
            <div className="chat-new-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>Agent auswählen</span>
                <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewChat(false); setAgentSearch(''); }}>×</button>
              </div>
              <input
                className="chat-search-input"
                placeholder="Agent suchen..."
                value={agentSearch}
                onChange={e => setAgentSearch(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '8px 0' }}>
                <button
                  className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCategoryFilter('all')}
                >Alle</button>
                {categories.map(c => (
                  <button
                    key={c}
                    className={`btn btn-sm ${categoryFilter === c ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setCategoryFilter(c)}
                  >{c}</button>
                ))}
              </div>
              <div className="chat-agent-list">
                {filteredAgents.slice(0, 50).map(a => (
                  <button key={a.id} className="chat-agent-item" onClick={() => handleNewChat(a.id)}>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 12 }}>{a.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{a.category} · {a.role}</div>
                    </div>
                    <span className={`badge ${a.status}`}>{a.status}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="chat-session-list">
          {loading && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Laden...</div>}
          {!loading && sessions.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Keine Konversationen.<br />Starte einen neuen Chat!
            </div>
          )}
          {sessions.map(session => (
            <div
              key={session.id}
              className={`chat-session-item${selectedSessionId === session.id ? ' active' : ''}`}
              onClick={() => setSelectedSessionId(session.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getAgentName(session.agentId)}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{formatTime(session.updatedAt)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.title}
                </div>
              </div>
              <button
                className="chat-delete-btn"
                onClick={e => { e.stopPropagation(); handleDeleteSession(session.id); }}
                title="Löschen"
              >×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-main">
        {!selectedSession ? (
          <div className="chat-empty">
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#x1F4AC;</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Kein Chat ausgewählt</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wähle eine Konversation oder starte einen neuen Chat</div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="chat-avatar">{getAgentName(selectedSession.agentId).charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{getAgentName(selectedSession.agentId)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {getAgentCategory(selectedSession.agentId)} · <span className={`badge ${getAgentStatus(selectedSession.agentId)}`} style={{ padding: '0 6px' }}>{getAgentStatus(selectedSession.agentId)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 12 }}>
                  Beginne die Konversation mit {getAgentName(selectedSession.agentId)}...
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.senderType}`}>
                  <div className="chat-bubble">
                    <div className="chat-bubble-content">{msg.content}</div>
                    <div className="chat-bubble-time">
                      {msg.senderType === 'agent' && <span style={{ marginRight: 6, fontWeight: 500 }}>{getAgentName(msg.sender)}</span>}
                      {new Date(msg.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="chat-message agent">
                  <div className="chat-bubble">
                    <div className="chat-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder={`Nachricht an ${getAgentName(selectedSession.agentId)}...`}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                rows={1}
              />
              <button
                className="btn btn-primary chat-send-btn"
                onClick={handleSend}
                disabled={!inputText.trim() || sending}
              >
                Senden
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
