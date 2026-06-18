import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, AlertTriangle, X, CheckCircle } from 'lucide-react';

export default function KillSwitchFAB() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleActivate = () => {
    setActivated(true);
    setTimeout(() => {
      setActivated(false);
      setShowConfirm(false);
    }, 3000);
  };

  return (
    <>
      <motion.button
        className="fixed flex items-center justify-center rounded-full z-[80]"
        style={{
          bottom: '24px',
          right: '24px',
          width: '48px',
          height: '48px',
          backgroundColor: 'var(--accent-danger)',
          boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
        }}
        whileHover={{
          boxShadow: '0 0 30px rgba(239,68,68,0.4)',
          scale: 1.05,
        }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowConfirm(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 1.3,
        }}
        title="Emergency Kill Switch"
      >
        <Power size={22} color="white" />
      </motion.button>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-[400px] rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: activated ? 'rgba(61,220,151,0.3)' : 'rgba(239,68,68,0.3)',
                boxShadow: activated ? '0 24px 80px rgba(61,220,151,0.2)' : '0 24px 80px rgba(239,68,68,0.2)',
              }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {activated ? (
                <div className="text-center py-4">
                  <div
                    className="inline-flex items-center justify-center rounded-full mb-4"
                    style={{
                      width: '56px',
                      height: '56px',
                      backgroundColor: 'rgba(61,220,151,0.15)',
                    }}
                  >
                    <CheckCircle size={28} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Kill Switch Activated
                  </h3>
                  <p className="mt-2" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    All agent processes have been terminated.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="flex items-center justify-center rounded-full"
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: 'rgba(239,68,68,0.15)',
                      }}
                    >
                      <AlertTriangle size={24} style={{ color: 'var(--accent-danger)' }} />
                    </div>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="p-1 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Emergency Kill Switch
                  </h3>
                  <p className="mt-2" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    This will immediately terminate all running agent processes and workflows. This action cannot be undone.
                  </p>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 px-4 py-2.5 rounded-lg border transition-all"
                      style={{
                        borderColor: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleActivate}
                      className="flex-1 px-4 py-2.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: 'var(--accent-danger)',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                      }}
                    >
                      Terminate All
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
