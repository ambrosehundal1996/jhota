import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export type IconName =
  | 'back'
  | 'close'
  | 'plus'
  | 'minus'
  | 'check'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'search'
  | 'barcode'
  | 'camera'
  | 'bolt'
  | 'today'
  | 'progress'
  | 'profile'
  | 'dumbbell'
  | 'trendDown'
  | 'heart'
  | 'heartFilled'
  | 'fork'
  | 'edit'
  | 'trash'
  | 'copy'
  | 'calendar'
  | 'sigma'
  | 'flame'
  | 'image'
  | 'bell'
  | 'sparkle'
  | 'backspace'
  | 'apple'
  | 'cloudOff';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 22, color = colors.text, strokeWidth = 1.8 }: Props) {
  const p = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const content = (() => {
    switch (name) {
      case 'back':
      case 'chevronLeft':
        return <Path d="M15 5l-7 7 7 7" {...p} />;
      case 'chevronRight':
        return <Path d="M9 5l7 7-7 7" {...p} />;
      case 'chevronDown':
        return <Path d="M6 9l6 6 6-6" {...p} />;
      case 'close':
        return <Path d="M6 6l12 12M18 6L6 18" {...p} />;
      case 'plus':
        return <Path d="M12 5v14M5 12h14" {...p} />;
      case 'minus':
        return <Path d="M5 12h14" {...p} />;
      case 'check':
        return <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />;
      case 'search':
        return (
          <>
            <Circle cx="11" cy="11" r="6.5" {...p} />
            <Path d="M16 16l4 4" {...p} />
          </>
        );
      case 'barcode':
        return <Path d="M4 7V5h3M17 5h3v2M20 17v2h-3M7 19H4v-2M8 8v8M11 8v8M14 8v8M17 8v8" {...p} />;
      case 'camera':
        return (
          <>
            <Path d="M4 8.5A1.5 1.5 0 015.5 7h2.3l1.4-2h5.6l1.4 2h2.3A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5z" {...p} />
            <Circle cx="12" cy="13" r="3.5" {...p} />
          </>
        );
      case 'image':
        return (
          <>
            <Rect x="4" y="5" width="16" height="14" rx="2" {...p} />
            <Circle cx="9" cy="10" r="1.5" {...p} />
            <Path d="M20 16l-4.5-4.5L8 19" {...p} />
          </>
        );
      case 'bolt':
        return <Path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" {...p} />;
      case 'today':
        return <Path d="M4 17h16M7 17a5 5 0 0110 0M12 6V4M5.6 9.6L4.2 8.2M18.4 9.6l1.4-1.4M3 13h2M19 13h2" {...p} />;
      case 'progress':
        return <Path d="M5 20V12M10 20V8M15 20v-6M20 20V5M3 20h18" {...p} />;
      case 'profile':
        return (
          <>
            <Circle cx="12" cy="12" r="9" {...p} />
            <Circle cx="12" cy="10" r="3" {...p} />
            <Path d="M6.5 18.2a6.5 6.5 0 0111 0" {...p} />
          </>
        );
      case 'dumbbell':
        return <Path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12" {...p} />;
      case 'trendDown':
        return <Path d="M4 7l6 6 3-3 7 7M20 12v5h-5" {...p} />;
      case 'heart':
        return <Path d="M12 19.5s-7-4.4-7-9.6A3.9 3.9 0 0112 7.6a3.9 3.9 0 017 2.3c0 5.2-7 9.6-7 9.6z" {...p} />;
      case 'heartFilled':
        return <Path d="M12 19.5s-7-4.4-7-9.6A3.9 3.9 0 0112 7.6a3.9 3.9 0 017 2.3c0 5.2-7 9.6-7 9.6z" {...p} fill={color} />;
      case 'fork':
        return <Path d="M7 3v6a2 2 0 002 2v10M11 3v6a2 2 0 01-2 2M9 3v5M16 21V3c2 1 3 3.5 3 7h-3" {...p} />;
      case 'edit':
        return <Path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" {...p} />;
      case 'trash':
        return <Path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" {...p} />;
      case 'copy':
        return (
          <>
            <Rect x="8" y="8" width="11" height="11" rx="2" {...p} />
            <Path d="M5 15V6a1 1 0 011-1h9" {...p} />
          </>
        );
      case 'calendar':
        return (
          <>
            <Rect x="4" y="5.5" width="16" height="14" rx="2" {...p} />
            <Path d="M4 10h16M8 3.5v4M16 3.5v4" {...p} />
          </>
        );
      case 'sigma':
        return <Path d="M17 5H7l5.5 7L7 19h10" {...p} />;
      case 'flame':
        return <Path d="M12 21c3.6 0 6-2.4 6-5.6 0-3.6-3-5.4-3.6-9.4-2.4 1.6-3.6 3.8-3.4 6-1.2-.6-2-1.8-2.2-3C7.2 10.6 6 12.8 6 15.4 6 18.6 8.4 21 12 21z" {...p} />;
      case 'bell':
        return <Path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0" {...p} />;
      case 'sparkle':
        return <Path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.5l5.1-1.9zM18.5 16.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" {...p} />;
      case 'backspace':
        return <Path d="M9 6h10a1 1 0 011 1v10a1 1 0 01-1 1H9l-5-6zM12 9.5l5 5M17 9.5l-5 5" {...p} />;
      case 'apple':
        return (
          <Path
            d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8C7 7.4 5.6 8.3 4.8 9.7c-1.6 2.8-.4 6.9 1.2 9.1.8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 2.9-.7s1.7.7 2.9.7 2-1.1 2.7-2.2c.9-1.3 1.2-2.5 1.2-2.6 0 0-2.4-.9-2.4-3.7zM14.2 5.8c.6-.8 1-1.8.9-2.8-.9 0-2 .6-2.6 1.4-.6.6-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.3z"
            fill={color}
          />
        );
      case 'cloudOff':
        return <Path d="M4 4l16 16M8.5 8.6A5 5 0 007 18h9.5M12.3 7.1A5 5 0 0117 11a3.5 3.5 0 012.7 5.7" {...p} />;
    }
  })();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {content}
    </Svg>
  );
}
