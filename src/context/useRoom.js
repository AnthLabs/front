import { useContext } from 'react';
import { RoomContext } from './RoomContext';

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom doit être utilisé à l\'intérieur de RoomProvider');
  return context;
}
