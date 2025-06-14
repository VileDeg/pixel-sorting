import React from "react";

import type { SortStep } from "../sortPipeline/sortPipeline";
import { StepContainer, StepHeader, RemoveButton, Select, ToggleButton, ThresholdLabel, ThresholdInput, RangeSlider } from "./styles";

import { ThresholdControl } from "../common/thresholdControl/thresholdControl";

type Props = {
  step: SortStep;
  index: number;
  onUpdate: (update: Partial<SortStep>) => void;
  onRemove: () => void;
};


export const SortStepEditor: React.FC<Props> = ({ step, index, onUpdate, onRemove }) => {
  //const [editingThreshold, setEditingThreshold] = useState(false);
  //const inputRef = useRef<HTMLInputElement>(null);

  // useEffect(() => {
  //   if (editingThreshold && inputRef.current) {
  //     inputRef.current.focus();
  //   }
  // }, [editingThreshold]);


  // const handleThresholdChange = (newThreshold: number) => {
  //   onUpdate({ threshold: newThreshold });
  // };

  const handleToggleDisabled = () => {
    onUpdate({ disabled: !step.disabled });
  };

  return (
    <StepContainer>
      <StepHeader>
        <strong>Step {index + 1}</strong>
        <label>
          <input
            type="checkbox"
            checked={!step.disabled}
            onChange={handleToggleDisabled}
          />
          Enabled
        </label>
        <RemoveButton onClick={onRemove}>🗑️</RemoveButton>
      </StepHeader>

      <div>
        <label>
          Direction:
          <Select
            value={step.direction}
            onChange={(e) =>
              onUpdate({ direction: e.target.value as SortStep["direction"] })
            }
            disabled={step.disabled} // Disable input when step is disabled
          >
            <option value="rows">Rows</option>
            <option value="cols">Columns</option>
            <option value="diag">Diagonal</option>
          </Select>
        </label>

        <label>
          Order:
          <ToggleButton
            onClick={() =>
              onUpdate({ order: step.order === "asc" ? "desc" : "asc" })
            }
            disabled={step.disabled} // Disable input when step is disabled
          >
            {step.order === "asc" ? "⬆️ Ascending" : "⬇️ Descending"}
          </ToggleButton>
        </label>
      </div>
      {/* <label>
        <input
          type="checkbox"
          checked={step.useLocalThreshold}
          onChange={(e) => onUpdate({ useLocalThreshold: e.target.checked })}
        />
        Use custom threshold
      </label> */}
      {/* {step.useLocalThreshold &&
        <ThresholdControl name="Threshold" threshold={step.threshold!} onThresholdChange={handleThresholdChange}
        />} */}
      {/* 
      <ThresholdLabel
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
    </StepContainer>
  );
};
