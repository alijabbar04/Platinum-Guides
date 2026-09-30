import { useProgress } from './progress';
import { palettes } from './theme';

export function usePalette() {
  const p = useProgress();
  return palettes[p.settings.theme] ?? palettes.lamplight;
}
