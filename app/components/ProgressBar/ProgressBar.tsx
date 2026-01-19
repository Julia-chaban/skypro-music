import React from 'react';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  max: number;
  value: number;
  step?: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProgressBar({
  max,
  value,
  step = 1,
  onChange,
}: ProgressBarProps) {
  return (
    <input
      className={styles.styledProgressInput}
      type="range"
      min={0}
      max={max}
      value={value}
      step={step}
      onChange={onChange}
    />
  );
}
