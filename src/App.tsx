import { useState, useEffect } from "react";
import "./App.css";

import { PixelSorter } from "./components/pixelSorter/pixelSorter.tsx";
import { UploadPage } from "./components/uploadPage/uploadPage.tsx";
import { Gallery } from "./components/galleryPage/galleryPage.tsx";
import { TopBar } from "./components/topBar/topBar.tsx";

const App = () => {
  const [currentPage, setCurrentPage] = useState<"gallery" | "pixelSorter">("pixelSorter");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<{ src: string; title: string }[]>([]);

  const onUpload = (file: File) => {
    setImageFile(file);
  };

  const onGoBack = () => {
    setImageFile(null);
  };

  const handleNavigate = (page: "gallery" | "pixelSorter") => {
    setCurrentPage(page);
  };

  useEffect(() => {
    const imageFiles = [
      "cat_edge_rows_asc.png",
      "lenna_edge_rows_asc.png",
      "checkerboard_edge_cols_desc_rows_desc.png",
    ];
    
    // Generate titles and check for duplicates
    const titleCount: Record<string, number> = {}; // Track occurrences of each title

    let images = imageFiles.map((fileName) => {
      const src = `/gallery/${fileName}`;
      const nameBase = fileName.split("_")[0];
      const title = nameBase.charAt(0).toUpperCase() + nameBase.slice(1);
      // Handle duplicate titles
      if (titleCount[title]) {
        titleCount[title]++;
        return { src, title: `${title} ${titleCount[title]}` }; // Append number to duplicate title
      } else {
        titleCount[title] = 1;
        return { src, title };
      }
    });
    
    setGalleryImages(images);
  }, []);

  return (
    <div style={{ display: 'block' }}>
      <TopBar currentPage={currentPage} onNavigate={handleNavigate} />
      <div style={{ marginTop: "60px" }}>
        {currentPage === "gallery" ? (
          <Gallery images={galleryImages} />
        ) : imageFile != null ? (
          <PixelSorter imageFile={imageFile} onGoBack={onGoBack} />
        ) : (
          <UploadPage onUpload={onUpload} />
        )}
      </div>
    </div>
  );
};

export default App;