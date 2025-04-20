import styled from "styled-components";

export const StepContainer = styled.div`
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

export const StepHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #c00;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    color: red;
  }
`;

export const Select = styled.select`
  margin-right: 1rem;
  padding: 0.3rem;
`;

//background-color: #eee;
// &:hover {
//     background-color: #ddd;
//   }
export const ToggleButton = styled.button`
  padding: 0.3rem 0.7rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;

  
`;

export const ThresholdLabel = styled.label`
  display: block;
  margin-top: 0.5rem;
  cursor: pointer;
`;

export const ThresholdInput = styled.input`
  margin-left: 0.5rem;
`;

export const RangeSlider = styled.input`
  width: 100%;
  margin-top: 0.5rem;
`;