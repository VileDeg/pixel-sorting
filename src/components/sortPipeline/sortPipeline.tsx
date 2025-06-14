import React from "react";
import { v4 as uuidv4 } from "uuid";
import { SortStepEditor } from "../sortStepEditor/sortStepEditor";

import { Container, AddButton } from "./styles";

type SortDirection = "rows" | "cols" | "diag";
type SortOrder = "asc" | "desc";

export type SortStep = {
  id: string;
  direction: SortDirection;
  order: SortOrder;
  //threshold?: number; only used if useLocalThreshold is true
  disabled: boolean; // New property to track if the step is disabled
};

type SortPipelineProps = {
  pipeline: SortStep[];
  globalThreshold: number;
  onPipelineChange: (steps: SortStep[]) => void;
};

export const SortPipeline: React.FC<SortPipelineProps> = ({
  pipeline,
  //globalThreshold,
  onPipelineChange
}) => {
  const updateStep = (id: string, updated: Partial<SortStep>) => {
    onPipelineChange(
      pipeline.map((step) => (step.id === id ? { ...step, ...updated } : step))
    );
  };

  const removeStep = (id: string) => {
    onPipelineChange(pipeline.filter((step) => step.id !== id));
  };

  const addStep = () => {
    onPipelineChange([
      ...pipeline,
      {
        id: uuidv4(),
        direction: "rows",
        order: "asc",
        //useLocalThreshold: false,
        //threshold: globalThreshold,
        disabled: false // Default to enabled
      }
    ]);
  };

  return (
    <Container>
      <h3>Sort Pipeline</h3>
      {pipeline.map((step, index) => (
        <SortStepEditor
          key={step.id}
          step={step}
          index={index}
          onUpdate={(updated) => updateStep(step.id, updated)}
          onRemove={() => removeStep(step.id)}
        />
      ))}
      <AddButton onClick={addStep}>➕ Add Step</AddButton>
    </Container>
  );
};
