"use client";

import React from "react";

const SLTRLogo = React.memo(function SLTRLogo({
  size = 200,
  connected = false,
  dark = true,
  accentColor = "#FF6B35",
}: {
  size?: number;
  connected?: boolean;
  dark?: boolean;
  accentColor?: string;
}) {
  const width = size * 2.3;
  const height = size;
  const textColor = dark ? "#FFFFFF" : "#000000";

  return (
    <>
      <style jsx>{`
        @keyframes sltrChainConnect {
          from {
            opacity: 0;
            transform: scaleY(0);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @keyframes sltrChainDisconnect {
          from {
            opacity: 1;
            transform: scaleY(1);
          }
          to {
            opacity: 0;
            transform: scaleY(0);
          }
        }

        @keyframes sltrDotFadeIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes sltrDotFadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0);
          }
        }

        .sltr-middle {
          transform-origin: center;
          transition: all 0.3s ease-in-out;
        }

        .sltr-middle--on {
          animation: sltrChainConnect 0.3s ease-in-out forwards;
        }

        .sltr-middle--off {
          animation: sltrChainDisconnect 0.3s ease-in-out forwards;
        }

        .sltr-dot {
          transition: all 0.3s ease-in-out;
        }

        .sltr-dot--on {
          animation: sltrDotFadeIn 0.3s ease-in-out forwards;
        }

        .sltr-dot--off {
          animation: sltrDotFadeOut 0.3s ease-in-out forwards;
        }
      `}</style>
      <svg
        width={width}
        height={height}
        viewBox="0 0 850 400"
        fill="none"
        role="img"
        aria-label={`SLTR logo - chain ${connected ? "connected" : "broken"}`}
      >
        {/* S */}
        <text
          x="50"
          y="180"
          fontSize="160"
          fontWeight="900"
          fill={textColor}
          fontFamily="'Orbitron', system-ui, -apple-system, sans-serif"
          letterSpacing="-6"
        >
          S
        </text>

        {/* L */}
        <text
          x="180"
          y="180"
          fontSize="160"
          fontWeight="900"
          fill={textColor}
          fontFamily="'Orbitron', system-ui, -apple-system, sans-serif"
          letterSpacing="-6"
        >
          L
        </text>

        {/* Dot under SL */}
        <circle cx="60" cy="280" r="15" fill={textColor} />

        {/* T - accent color */}
        <text
          x="90"
          y="330"
          fontSize="160"
          fontWeight="900"
          fill={accentColor}
          fontFamily="'Orbitron', system-ui, -apple-system, sans-serif"
          letterSpacing="-6"
        >
          T
        </text>

        {/* R */}
        <text
          x="220"
          y="330"
          fontSize="160"
          fontWeight="900"
          fill={textColor}
          fontFamily="'Orbitron', system-ui, -apple-system, sans-serif"
          letterSpacing="-6"
        >
          R
        </text>

        {/* Chain group */}
        <g transform="translate(250, 10) scale(1.8)">
          {/* Top hook */}
          <path
            d={`M60 80 L60 60 A20 20 0 0 1 100 60 L100 ${
              connected ? 90 : 75
            }`}
            stroke={accentColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            className="sltr-chain-part"
          />

          {/* Bottom hook */}
          <path
            d={`M140 120 L140 140 A20 20 0 0 1 100 140 L100 ${
              connected ? 110 : 125
            }`}
            stroke={accentColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            className="sltr-chain-part"
          />

          {/* Middle piece – fades/scales in */}
          <path
            d="M100 90 L100 110"
            stroke={accentColor}
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            className={`sltr-middle ${
              connected ? "sltr-middle--on" : "sltr-middle--off"
            }`}
          />

          {/* Break dots – fade out when connected */}
          <circle
            cx="100"
            cy="90"
            r="8"
            fill={accentColor}
            className={`sltr-dot ${
              connected ? "sltr-dot--off" : "sltr-dot--on"
            }`}
          />
          <circle
            cx="100"
            cy="110"
            r="8"
            fill={accentColor}
            className={`sltr-dot ${
              connected ? "sltr-dot--off" : "sltr-dot--on"
            }`}
          />
        </g>
      </svg>
    </>
  );
});

export default SLTRLogo;
