import React from 'react';
import styles from './VolumeControl.module.css';

interface VolumeControlProps {
  volume: number;
  onChange: (volume: number) => void;
}

export default function VolumeControl({
  volume,
  onChange,
}: VolumeControlProps) {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onChange(newVolume);
  };

  return (
    <input
      className={`${styles.volume__progressLine} ${styles.btn}`}
      type="range"
      name="range"
      min="0"
      max="1"
      step="0.01"
      value={volume}
      onChange={handleVolumeChange}
    />
  );
}
