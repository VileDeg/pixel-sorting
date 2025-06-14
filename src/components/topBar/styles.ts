import styled from "styled-components";

export const TopBarContainer = styled.div`
  position: fixed; /* Fix the top bar at the top of the page */
  top: 0;
  left: 0;
  width: 100%; /* Span the entire width */
  display: flex;
  justify-content: flex-start; /* Align content to the left */
  align-items: center; /* Center items vertically */
  padding: 1rem;
  background-color: #282c34; /* Background color */
  color: white; /* Text color */
  //z-index: 1000; /* Ensure it stays above other elements */
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2); /* Add a subtle shadow for better visibility */
`;

export const TopBarButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background-color: #61dafb;
  color: #282c34;
  font-weight: bold;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #21a1f1;
  }
`;

