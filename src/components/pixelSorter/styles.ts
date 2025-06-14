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

export const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
  align-self: flex-start; /* Add this line */
`;

export const TooltipText = styled.div`
  visibility: hidden;
  width: 200px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 5px;
  padding: 0.5rem;
  position: absolute;
  z-index: 1;
  bottom: 125%; /* Position above the icon */
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;

  /* Arrow below the tooltip */
  &::after {
    content: '';
    position: absolute;
    top: 100%; /* At the bottom of the tooltip */
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
`;

export const TooltipIcon = styled.span`
  //font-size: 1.2rem;
  //color: #555;
  //border: 1px solid #ccc;
  //border-radius: 50%;
  padding: 0.2rem 0.4rem;
  //display: inline-flex;
  //align-self: flex-start; /* Prevents stretching */
  align-items: center;
  justify-content: center;

  &:hover + ${TooltipText} {
    visibility: visible;
    opacity: 1;
  }
`;

