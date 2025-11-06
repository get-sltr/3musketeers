'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MicroInteractions, { InteractiveButton } from './MicroInteractions'
import LazyWrapper, { LazyErosAI } from './LazyWrapper'

export default function BlazeAIButton() {
  const [showBlazeAI, setShowBlazeAI] = useState(false)

  return (
    <>
      <motion.div
        className="fixed bottom-24 left-4 z-50"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <MicroInteractions
          onClick={() => setShowBlazeAI(true)}
          className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:shadow-orange-500/25 transition-all duration-300"
          variant="button"
          sound={true}
        >
          🔥
        </MicroInteractions>
      </motion.div>

      <AnimatePresence>
        {showBlazeAI && (
          <motion.div 
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="glass-bubble max-w-4xl w-full h-[80vh] p-6"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-orange-400 flex items-center gap-2">
                  🏹 EROS Assistant
                </h2>
                <InteractiveButton
                  onClick={() => setShowBlazeAI(false)}
                  variant="ghost"
                  size="small"
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </InteractiveButton>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <LazyWrapper variant="fullscreen">
                  <LazyErosAI 
                    conversationId="" 
                    onAIMessage={(message) => {
                      console.log('AI suggested message:', message)
                    }}
                  />
                </LazyWrapper>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
