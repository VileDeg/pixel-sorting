import styled from "styled-components";
import { theme } from "../../styles/theme";

export const StyledButton = styled.button`
  padding: '10px 16px';
  backgroundColor: '#4CAF50';
  color: 'white';
  border: 'none';
  borderRadius: '4px';
  cursor: 'pointer';
  marginTop: '10px';
  fontSize: '16px';
`;

export const ToggleButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background-color: ${(props) => (props.active ? "#4caf50" : "#ccc")};
  color: ${(props) => (props.active ? "white" : "#666")};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;

  &:hover {
    background-color: ${(props) => (props.active ? "#45a049" : "#ddd")};
  }
`;

export const ToggleButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
`;

export const PreviewContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

export const PreviewCaption = styled.div`
  font-weight: bold;
  font-size: 1rem;
`;

export const CanvasWrapper = styled.div`
  padding: 0.5rem;
  display: inline-block;
`;

export const CollapsiblePreview = styled.details<{ isVisible: boolean }>`
  width: 100%;
  display: ${(props) => (props.isVisible ? "block" : "none")}; /* Control visibility */
`;

export const CollapsibleSummary = styled.summary`
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
  }
`;

export const CollapsibleContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;