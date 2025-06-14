import styled from "styled-components";

export const GalleryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;

export const GalleryItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const ImageWrapper = styled.div`
  max-width: 420px; /* Set max width to avoid overflow */
  max-height: 420px; /* Set max height to avoid overflow */
  //overflow: hidden;

  img {
    width: 100%;
    height: auto;
    object-fit: contain; /* Ensure the image fits within the container */
    border: 2px solid #ccc;
    border-radius: 8px;
  }
`;

export const ImageTitle = styled.div`
  margin-top: 0.5rem;
  font-size: 1rem;
  font-weight: bold;
  text-align: center;
`;
