import React from "react";

import type { SortStep } from "../sortPipeline/sortPipeline";
import {
  StepContainer,
  StepHeader,
  RemoveButton,
  Select,
  ToggleButton
} from "./styles";

type Props = {
  step: SortStep;
  index: number;
  onUpdate: (update: Partial<SortStep>) => void;
  onRemove: () => void;
};

export const SortStepEditor: React.FC<Props> = ({
  step,
  index,
  onUpdate,
  onRemove
}) => {
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
    </StepContainer>
  );
};
