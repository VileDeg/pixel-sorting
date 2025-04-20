import { useState, useRef } from 'react';

import { ThresholdLabel, ThresholdInput, RangeSlider } from "./styles";

interface ThresholdControlProps {
  threshold: number;
  onThresholdChange: (newThreshold: number) => void;
}

export const ThresholdControl: React.FC<ThresholdControlProps> = ({ threshold, onThresholdChange }) => {
  const [editing, setEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = Number(e.target.value);
    onThresholdChange(newThreshold);
  };

  const handleManualInput = (e: React.FocusEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    if (e.type === 'blur' || (e as React.KeyboardEvent).key === 'Enter') {
      const newThreshold = Math.min(255, Math.max(0, Number((e.target as HTMLInputElement).value)));
      onThresholdChange(newThreshold);
      setEditing(false);
    }
  };

  const handleDoubleClick = () => {
    setEditing(true);
  };

  // Auto-focus the input when it becomes editable
  const handleInputFocus = () => {
    if (inputRef.current) {
      inputRef.current.select(); // Select the number when focused for instant editing
    }
  };

  return (
    <div>

      {/* <ThresholdLabel
        title="Double-click to enter value manually"
        onDoubleClick={() => setEditingThreshold(true)}
      >
        Threshold:
        {editingThreshold ? (
          <ThresholdInput
            type="number"
            ref={inputRef}
            value={step.threshold}
            min={0}
            max={255}
            onBlur={() => setEditingThreshold(false)}
            onChange={(e) => onUpdate({ threshold: Number(e.target.value) })}
          />
        ) : (
          ` ${step.threshold}`
        )}
      </ThresholdLabel>

      <RangeSlider
        type="range"
        min={0}
        max={255}
        value={step.threshold}
        onChange={(e) => onUpdate({ threshold: Number(e.target.value) })}
      /> */}

      <label>
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            min="0"
            max="255"
            defaultValue={threshold}
            autoFocus
            onBlur={handleManualInput}
            onKeyDown={handleManualInput}
            onFocus={handleInputFocus}
            title="Click to edit threshold"
          />
        ) : (
          <span onDoubleClick={handleDoubleClick} title="Double-click to edit threshold">
            Threshold: {threshold}
          </span>
        )}
        <input
          type="range"
          min="0"
          max="255"
          value={threshold}
          onChange={handleThresholdChange}
          style={{ width: '100%' }}
          title="Drag to adjust threshold"
        />
      </label>
    </div>
  );
};
