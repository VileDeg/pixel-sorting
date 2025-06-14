import React from "react";

import {
  GalleryContainer,
  GalleryItem,
  ImageWrapper,
  ImageTitle
} from "./styles.ts";

interface GalleryProps {
  images: { src: string; title: string }[];
}

export const Gallery: React.FC<GalleryProps> = ({ images }) => {
  return (
    <GalleryContainer>
      {images.map((image, index) => (
        <GalleryItem key={index}>
          <ImageWrapper>
            <img src={image.src} alt={image.title} />
          </ImageWrapper>
          <ImageTitle>{image.title}</ImageTitle>
        </GalleryItem>
      ))}
    </GalleryContainer>
  );
};
