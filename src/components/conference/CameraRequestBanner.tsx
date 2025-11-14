'use client'

import { Room } from "livekit-client"

import { useCameraRequest } from "@/hooks/useCameraRequest"

export default function CameraRequestBanner({ room }: { room: Room }) {
  const { request, clearRequest } = useCameraRequest(room)

  if (!request) return null

  const turnCameraOn = () => {
    room.localParticipant.setCameraEnabled(true)
    clearRequest()
  }

  return (
    <div className="
      fixed bottom-24 left-1/2 -translate-x-1/2 z-[40]
      max-w-md w-[90%] px-4 py-3
      bg-black/80 border border-purple-400/40
      rounded-2xl backdrop-blur-2xl
      shadow-[0_0_25px_rgba(180,99,255,0.55)]
      text-xs
    ">
      <div className="font-semibold text-sm mb-1">
        Camera requested by {request.fromName}
      </div>
      <p className="text-white/80 mb-3">
        {request.message}
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={clearRequest}
          className="px-3 py-1 rounded-full bg-white/10 text-white/80"
        >
          Not now
        </button>
        <button
          onClick={turnCameraOn}
          className="px-3 py-1 rounded-full bg-purple-600/80"
        >
          Turn camera on
        </button>
      </div>
    </div>
  )
}

