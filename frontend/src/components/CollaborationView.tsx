import { useState, useEffect, useRef } from 'react';
import type { Agent, CollaborationSession, CollaborationMessage } from '../types';
import { collaborationAPI } from '../services/api';

interface CollabProps {
  agents: Agent[];
}

type CollabSessionFull = CollaborationSession & { id: string };

export default function CollaborationView({ agents }: CollabProps) {
  const [sessions, setSessions] = useState<CollabSessionFull[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<CollaborationSession['delegationStrategy']>('round-robin');
  const [conflict, setConflict] = useState<CollaborationSession['conflictResolution']>('coordinator-decides');
  const [agentSearch, setAgentSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  // Message input
  const [msgInput, setMsgInput] = useState('');
  const [msgSender, setMsgSender] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try {
      const res = await collaborationAPI.listSessions();
      setSessions(res.sessions as CollabSessionFull[]);
    } catch { /* fallback */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    loadMessages(selectedId);
    const session = sessions.find(s => s.id === selectedId);
    if (session?.agents?.length) setMsgSender(session.agents[0]);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(selectedId), 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedId]);

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await collaborationAPI.getMessages(sessionId);
      setMessages(res.messages as CollaborationMessage[]);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreate = async () => {
    if (!newName.trim() || selectedAgents.length < 2) return;
    try {
      const session = await collaborationAPI.createSession({
        name: newName,
        agents: selectedAgents,
        coordinatorPrompt: newPrompt,
        delegationStrategy: strategy,
        conflictResolution: conflict,
      });
      setSessions(prev => [session as CollabSessionFull, ...prev]);
      setSelectedId((session as CollabSessionFull).id);
      setShowCreate(false);
      setNewName(''); setNewPrompt(''); setSelectedAgents([]);
    } catch { /* ignore */ }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await collaborationAPI.updateSession(id, { status });
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: status as CollaborationSession['status'] } : s));
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await collaborationAPI.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (selectedId === id) { setSelectedId(null); setMessages([]); }
    } catch { /* ignore */ }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !selectedId || !msgSender) return;
    try {
      await collaborationAPI.sendMessage(selectedId, msgSender, msgInput.trim());
      setMsgInput('');
      loadMessages(selectedId);
    } catch { /* ignore */ }
  };

  const getAgentName = (id: string) => agents.find(a => a.id === id)?.name ?? id;
  const getAgentCategory = (id: string) => agents.find(a => a.id === id)?.category ?? '';
  const selectedSession = sessions.find(s => s.id === selectedId);
  const categories = [...new Set(agents.map(a => a.category))].sort();
  const filteredAgents = agents.filter(a => {
    const matchSearch = !agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()) || a.category.includes(agentSearch.toLowerCase());
    const matchCat = catFilter === 'all' || a.category === catFilter;
    return matchSearch && matchCat;
  });

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const msgTypeIcon: Record<string, string> = {
    message: '',
    system: '⚙',
    decision: '✓',
    file_share: '📎',
  };

  return (
    <div className="collab-layout">
      {/* Session List */}
      <div className="collab-sidebar">
        <div className="collab-sidebar-header">
          <span style={{ fontWeight: 600, fontSize: 13 }}>Sessions</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Neu</button>
        </div>

        <div className="collab-session-list">
          {loading && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Laden...</div>}
          {!loading && sessions.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Keine Sessions vorhanden.<br />Erstelle eine neue Collaboration!
            </div>
          )}
          {sessions.map(session => (
            <div
              key={session.id}
              className={`collab-session-item${selectedId === session.id ? ' active' : ''}`}
              onClick={() => setSelectedId(session.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 500, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.name}</span>
                  <span className={`badge ${session.status}`} style={{ flexShrink: 0 }}>{session.status}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {session.agents.length} Agenten · {session.delegationStrategy}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="collab-main">
        {showCreate ? (
          <div className="collab-create-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>Neue Collaboration Session</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            <div className="collab-form">
              <label className="collab-label">Name *</label>
              <input className="chat-search-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="z.B. Security Audit Sprint" />

              <label className="collab-label">Koordinator-Prompt</label>
              <textarea className="collab-textarea" value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="Beschreibe die Aufgabe der Collaboration..." rows={3} />

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label className="collab-label">Delegierungsstrategie</label>
                  <select className="collab-select" value={strategy} onChange={e => setStrategy(e.target.value as CollaborationSession['delegationStrategy'])}>
                    <option value="round-robin">Round Robin</option>
                    <option value="capability-based">Capability-based</option>
                    <option value="load-balanced">Load Balanced</option>
                    <option value="priority">Priority</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="collab-label">Konfliktlösung</label>
                  <select className="collab-select" value={conflict} onChange={e => setConflict(e.target.value as CollaborationSession['conflictResolution'])}>
                    <option value="coordinator-decides">Koordinator entscheidet</option>
                    <option value="voting">Abstimmung</option>
                    <option value="merge">Merge</option>
                    <option value="priority-based">Prioritätsbasiert</option>
                  </select>
                </div>
              </div>

              <label className="collab-label">Agenten auswählen ({selectedAgents.length} gewählt, mind. 2 *)</label>
              <input className="chat-search-input" value={agentSearch} onChange={e => setAgentSearch(e.target.value)} placeholder="Agent suchen..." style={{ marginBottom: 6 }} />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                <button className={`btn btn-sm ${catFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatFilter('all')}>Alle</button>
                {categories.map(c => (
                  <button key={c} className={`btn btn-sm ${catFilter === c ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCatFilter(c)}>{c}</button>
                ))}
              </div>
              <div className="collab-agent-picker">
                {filteredAgents.slice(0, 60).map(a => {
                  const isSel = selectedAgents.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      className={`collab-agent-chip${isSel ? ' selected' : ''}`}
                      onClick={() => setSelectedAgents(prev => isSel ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                    >
                      {a.name}
                      <span style={{ fontSize: 9, opacity: 0.55, marginLeft: 4 }}>{a.category}</span>
                    </button>
                  );
                })}
              </div>

              <button className="btn btn-primary" onClick={handleCreate} disabled={!newName.trim() || selectedAgents.length < 2} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
                Session erstellen
              </button>
            </div>
          </div>
        ) : !selectedSession ? (
          <div className="chat-empty">
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>&#x2694;</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Keine Session ausgewählt</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Wähle eine Session oder erstelle eine neue Collaboration</div>
          </div>
        ) : (
          <>
            {/* Session Header */}
            <div className="collab-detail-header">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{selectedSession.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedSession.delegationStrategy} · {selectedSession.conflictResolution} · Konsens: {selectedSession.consensusThreshold}%
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className={`badge ${selectedSession.status}`}>{selectedSession.status}</span>
                {selectedSession.status === 'active' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(selectedSession.id, 'paused')}>Pause</button>
                )}
                {selectedSession.status === 'paused' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedSession.id, 'active')}>Fortsetzen</button>
                )}
                {selectedSession.status !== 'completed' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => handleStatusChange(selectedSession.id, 'completed')}>Abschließen</button>
                )}
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }} onClick={() => handleDelete(selectedSession.id)}>Löschen</button>
              </div>
            </div>

            {/* Agents */}
            <div className="collab-agents-bar">
              {selectedSession.agents.map(aid => (
                <span key={aid} className="badge active" style={{ padding: '3px 10px', fontSize: 11 }}>
                  {getAgentName(aid)}
                  <span style={{ opacity: 0.5, marginLeft: 4, fontSize: 10 }}>{getAgentCategory(aid)}</span>
                </span>
              ))}
            </div>

            {/* Coordinator Prompt */}
            {selectedSession.coordinatorPrompt && (
              <div className="collab-prompt-bar">{selectedSession.coordinatorPrompt}</div>
            )}

            {/* Messages */}
            <div className="collab-messages">
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 12 }}>
                  Noch keine Nachrichten. Sende die erste Nachricht als einer der Agenten.
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`collab-msg${msg.messageType !== 'message' ? ' special' : ''}`}>
                  <div className="collab-msg-avatar">{getAgentName(msg.senderId).charAt(0)}</div>
                  <div className="collab-msg-body">
                    <div className="collab-msg-header">
                      <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--accent-cyan)' }}>{getAgentName(msg.senderId)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{getAgentCategory(msg.senderId)}</span>
                      {msg.messageType !== 'message' && (
                        <span style={{ fontSize: 10, color: 'var(--accent-orange)', marginLeft: 6 }}>
                          {msgTypeIcon[msg.messageType]} {msg.messageType}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="collab-msg-content">{msg.content}</div>
                  </div>
                </div>
              ))}
              {selectedSession.synthesis && (
                <div className="collab-synthesis" style={{ margin: '12px 0' }}>
                  <span className="card-title" style={{ marginRight: 8 }}>Synthese:</span>
                  {selectedSession.synthesis}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input (only when active) */}
            {selectedSession.status === 'active' && (
              <div className="collab-input-area">
                <select className="collab-sender-select" value={msgSender} onChange={e => setMsgSender(e.target.value)}>
                  {selectedSession.agents.map(aid => (
                    <option key={aid} value={aid}>{getAgentName(aid)}</option>
                  ))}
                </select>
                <textarea
                  className="chat-input"
                  placeholder={`Nachricht als ${getAgentName(msgSender)}...`}
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  rows={1}
                />
                <button className="btn btn-primary chat-send-btn" onClick={handleSendMessage} disabled={!msgInput.trim()}>
                  Senden
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
