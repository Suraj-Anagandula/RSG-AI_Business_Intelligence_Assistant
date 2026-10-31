import React from 'react';
import {
  Monitor,
  Laptop,
  Mouse,
  Keyboard,
  Cpu,
  Layers,
  Globe,
  Store,
  Compass,
  Sparkles,
  Zap,
  Package,
  Armchair
} from 'lucide-react';

export function getCustomIcon(name, size = 18, color = 'currentColor') {
  if (!name) return <Package size={size} color={color} />;

  const lower = String(name).toLowerCase();

  // Products
  if (lower.includes('monitor')) return <Monitor size={size} color={color} />;
  if (lower.includes('laptop')) return <Laptop size={size} color={color} />;
  if (lower.includes('mouse')) return <Mouse size={size} color={color} />;
  if (lower.includes('keyboard')) return <Keyboard size={size} color={color} />;
  if (lower.includes('chair')) return <Armchair size={size} color={color} />;
  if (lower.includes('desk')) return <Layers size={size} color={color} />;
  if (lower.includes('hub') || lower.includes('usb')) return <Cpu size={size} color={color} />;

  // Sales Channels
  if (lower.includes('online') || lower.includes('web')) return <Globe size={size} color={color} />;
  if (lower.includes('retail') || lower.includes('store')) return <Store size={size} color={color} />;

  // Regions
  if (lower.includes('north') || lower.includes('south') || lower.includes('east') || lower.includes('west')) {
    return <Compass size={size} color={color} />;
  }

  // Categories
  if (lower.includes('electronic')) return <Zap size={size} color={color} />;
  if (lower.includes('accessori')) return <Sparkles size={size} color={color} />;
  if (lower.includes('furniture')) return <Layers size={size} color={color} />;

  return <Package size={size} color={color} />;
}

