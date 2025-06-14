import React from "react";

import { TopBarContainer, TopBarButton } from "./styles";

interface TopBarProps {
  currentPage: "gallery" | "pixelSorter";
  onNavigate: (page: "gallery" | "pixelSorter") => void;
}

export const TopBar: React.FC<TopBarProps> = ({ currentPage, onNavigate }) => {
  const buttonLabel = currentPage === "gallery" ? "Pixel Sorter" : "Gallery";

  return (
    <TopBarContainer>
      <TopBarButton
        onClick={() =>
          onNavigate(currentPage === "gallery" ? "pixelSorter" : "gallery")
        }
      >
        {buttonLabel}
      </TopBarButton>
    </TopBarContainer>
  );
};
