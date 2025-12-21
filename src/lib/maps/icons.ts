import { WaypointIcon } from '@/types';

// SVG data URIs for custom markers
// Each icon is a simple colored circle with an icon inside

const createMarkerSvg = (color: string, icon: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 28 20 28s20-13 20-28C40 8.954 31.046 0 20 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="20" cy="18" r="14" fill="white" opacity="0.9"/>
      <text x="20" y="24" text-anchor="middle" font-size="16" font-family="Arial">${icon}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const createCompletedMarkerSvg = (color: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 28 20 28s20-13 20-28C40 8.954 31.046 0 20 0z" fill="${color}" filter="url(#shadow)" opacity="0.6"/>
      <circle cx="20" cy="18" r="14" fill="white" opacity="0.9"/>
      <text x="20" y="24" text-anchor="middle" font-size="18" font-family="Arial">✓</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// Color and emoji for each icon type
const iconConfig: Record<WaypointIcon, { color: string; emoji: string }> = {
  checkpoint: { color: '#3B82F6', emoji: '📍' },  // Blue
  viewpoint: { color: '#8B5CF6', emoji: '👁️' },   // Purple
  food: { color: '#F97316', emoji: '🍴' },        // Orange
  fuel: { color: '#EF4444', emoji: '⛽' },        // Red
  accommodation: { color: '#06B6D4', emoji: '🏨' }, // Cyan
  start: { color: '#22C55E', emoji: '🏁' },       // Green
  finish: { color: '#22C55E', emoji: '🎯' },      // Green
  danger: { color: '#EF4444', emoji: '⚠️' },      // Red
  photo: { color: '#EC4899', emoji: '📷' },       // Pink
  water: { color: '#0EA5E9', emoji: '💧' },       // Light blue
};

export function getMarkerIcon(iconType: WaypointIcon, isCompleted: boolean = false): string {
  const config = iconConfig[iconType] || iconConfig.checkpoint;

  if (isCompleted) {
    return createCompletedMarkerSvg(config.color);
  }

  return createMarkerSvg(config.color, config.emoji);
}

export function getMarkerColor(iconType: WaypointIcon): string {
  return iconConfig[iconType]?.color || iconConfig.checkpoint.color;
}

// User location marker
export const userLocationMarkerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="3"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>
`)}`;

// Other user location marker
export const otherUserMarkerSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
    <circle cx="12" cy="12" r="8" fill="#9CA3AF" stroke="white" stroke-width="2"/>
  </svg>
`)}`;
