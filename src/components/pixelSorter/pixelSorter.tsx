import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import p5 from "p5";
import { useDebouncedCallback } from "use-debounce";
import {
  StyledButton,
  ToggleButton,
  ToggleButtonGroup,
  PreviewContainer,
  PreviewCaption,
  CanvasWrapper,
  CollapsiblePreview,
  CollapsibleSummary,
  CollapsibleContent,
  TooltipContainer,
  TooltipText,
  TooltipIcon
} from "./styles.ts";

import { ThresholdControl } from "../common/thresholdControl/thresholdControl.tsx";

import { SortStep, SortPipeline } from "../sortPipeline/sortPipeline";

import { Image } from "image-js";

import {
  getArrayRow,
  getArrayColumn,
  getArrayDiagonal
} from "../../utils/array.ts";

type CannyParams = {
  blurSigma: number; // Does not change anything, why?
  lowThreshold: number;
  highThreshold: number;
};
interface PixelSorterProps {
  imageFile: File;
  onGoBack: () => void;
}

export const PixelSorter: React.FC<PixelSorterProps> = ({
  imageFile,
  onGoBack
}) => {
  // p5.Image of the uploaded image to be sorted
  const [imgSrc, setImgSrc] = useState<p5.Image | null>(null);

  const [globalThreshold, setGlobalThreshold] = useState(100); // slider value

  const [useEdgeDetection, setUseEdgeDetection] = useState<boolean>(true);

  const [cannyParams, setCannyParams] = useState<CannyParams>({
    blurSigma: 1.1,
    lowThreshold: 10,
    highThreshold: 30
  });

  const [pipeline, setPipeline] = useState<SortStep[]>([
    {
      id: uuidv4(),
      direction: "rows", // Horizontal sort
      order: "asc", // Ascending order
      threshold: globalThreshold // Default threshold
    }
  ]);

  const p5ParentRef = useRef<HTMLDivElement>(document.createElement("div"));
  const p5Ref = useRef<p5 | null>(null);

  const maskCanvasRef = useRef<HTMLDivElement>(document.createElement("div"));
  const maskP5Ref = useRef<p5 | null>(null);

  const edgeCanvasRef = useRef<HTMLDivElement>(document.createElement("div"));
  const edgeP5Ref = useRef<p5 | null>(null);

  const defaultCanvasSize = [200, 200];
  const maxCanvasSize = [640, 640];

  const imgSrcPixelsOriginal = useRef<Float32Array>(new Float32Array()); // stored imgSrc pixels to reapply sort

  const sortImagePixelsDebounceDelayMs = 200;

  const sobelPixels = useRef<Float32Array>(new Float32Array()); // packed RGB of sobel map (grayscale)
  const threshPixels = useRef<Float32Array>(new Float32Array()); // packed RGB of thresholded image (grayscale)

  // Does not persist after update! Is set to original pixels at start of sorting
  let imgPixels: Float32Array = new Float32Array(); // packed RGB of sorted image

  // CREATE image canvas
  useEffect(() => {
    console.log("useEffect ON CANVAS CREATE (ATTACH TO DOM)");

    const sketch = (p: p5) => {
      p.setup = () => {
        p.pixelDensity(1); // 1 pixel = 1 pixel on canvas
        let [w, h] = defaultCanvasSize;
        p.createCanvas(w, h);
        p.background(240);
      };

      p.draw = () => {};
    };

    // Create a new p5 instance and attach it to the sketchRef
    p5Ref.current = new p5(sketch, p5ParentRef.current);

    // Cleanup on unmount
    return () => {
      console.log("CLEANUP useEffect ON CANVAS CREATE");
      p5Ref.current?.remove();
      //setIsImageLoaded(false);
    };
  }, []);

  // CREATE threshold mask canvas
  useEffect(() => {
    const sketch = (p: p5) => {
      p.setup = () => {
        p.pixelDensity(1);
        let [w, h] = defaultCanvasSize;
        p.createCanvas(w, h);
        p.background(240);
      };

      p.draw = () => {};
    };

    maskP5Ref.current?.remove(); // Clean up previous canvas
    maskP5Ref.current = new p5(sketch, maskCanvasRef.current);

    return () => {
      maskP5Ref.current?.remove();
    };
  }, []);

  // CREATE edge canvas
  useEffect(() => {
    const sketch = (p: p5) => {
      p.setup = () => {
        p.pixelDensity(1);
        let [w, h] = defaultCanvasSize;
        p.createCanvas(w, h);
        p.background(240);
      };

      p.draw = () => {};
    };

    edgeP5Ref.current?.remove(); // Clean up previous canvas
    edgeP5Ref.current = new p5(sketch, edgeCanvasRef.current);

    return () => {
      edgeP5Ref.current?.remove();
    };
  }, []);

  // ON IMAGE UPLOAD
  useEffect(() => {
    if (!p5Ref.current) {
      return;
    }

    console.log("useEffect ON IMAGE UPLOAD");

    const p = p5Ref.current;

    // Load the image
    const imageUrl = URL.createObjectURL(imageFile!);
    p.loadImage(
      imageUrl,
      (loadedImg) => {
        // Handle successful image load
        URL.revokeObjectURL(imageUrl);

        // Resize canvas based on image
        let [width, height] = getCanvasSizeForImage(loadedImg);
        // Resize canvas
        p.resizeCanvas(width, height);

        // TODO
        loadedImg.loadPixels(); // <- Ensure pixels are loaded BEFORE setting state

        let [iw, ih] = [loadedImg.width, loadedImg.height];

        // populate original pixels
        console.log("useEffect ON IMAGE LOAD (p5)");
        // Store original pixels in case of repeated sort
        imgSrcPixelsOriginal.current = new Float32Array(iw * ih);

        packFromP5(imgSrcPixelsOriginal.current, loadedImg, iw, ih);

        console.log("useEffect: imgSrc.pixels: ", loadedImg.pixels);
        console.log(
          "useEffect: imgSrcPixelsOriginal: ",
          imgSrcPixelsOriginal.current
        );

        setImgSrc(loadedImg); // Now it’s safe

        // Override draw function to display image
        p.draw = () => {
          // Must stay in draw to be updated on sort!
          p.image(loadedImg, 0, 0, p.width, p.height);
        };
      },
      (error) => {
        console.log("Failed to load image", error);
        URL.revokeObjectURL(imageUrl);
      }
    );
    console.log("IMAGE LOADED: ", imgSrc);
  }, []);

  // UPDATE threshold mask
  useEffect(() => {
    if (!maskP5Ref.current || !imgSrc) {
      return;
    }

    const p = maskP5Ref.current;

    let maskImage = p.createImage(imgSrc.width, imgSrc.height);
    // TODO: redundant, size is already known
    let [width, height] = getCanvasSizeForImage(maskImage);

    p.resizeCanvas(width, height);

    // Generate mask
    maskImage.loadPixels();

    // Compute based on original image (not sorted)
    let srcPixels = imgSrcPixelsOriginal.current;

    // Reset array to image size
    threshPixels.current = new Float32Array(imgSrc.width * imgSrc.height);

    for (let i = 0; i < imgSrc.width * imgSrc.height; i++) {
      // TODO: use local threshold somehow?
      const pixelValue = aboveThreshold(srcPixels[i], globalThreshold)
        ? 255
        : 0;
      // Populate global thresholded pixels to be used for sorting
      threshPixels.current[i] = pixelValue;

      maskImage.pixels[i * 4 + 0] = pixelValue;
      maskImage.pixels[i * 4 + 1] = pixelValue;
      maskImage.pixels[i * 4 + 2] = pixelValue;
      maskImage.pixels[i * 4 + 3] = 255;
    }
    maskImage.updatePixels();
    p.image(maskImage, 0, 0, p.width, p.height);

    p.draw = () => {}; // static image
  }, [imgSrc, globalThreshold]);

  // UPDATE edge map
  useEffect(() => {
    if (!edgeP5Ref.current || !imgSrc) {
      return;
    }

    const p = edgeP5Ref.current;

    const w = imgSrc.width;
    const h = imgSrc.height;

    let sobelImage = p.createImage(w, h);
    // TODO: redundant, size is already known
    let [canvasW, canvasH] = getCanvasSizeForImage(sobelImage);

    p.resizeCanvas(canvasW, canvasH);

    let srcPixels = imgSrcPixelsOriginal.current;

    const data = new Uint8Array(srcPixels.length * 3);
    for (let i = 0; i < srcPixels.length; i++) {
      const px = srcPixels[i];
      data[i * 3] = px;
      data[i * 3 + 1] = px >> 8;
      data[i * 3 + 2] = px >> 16;
    }

    let image: Image = new Image(w, h, data, { kind: "RGB" });
    // To grayscale, length of data reduced x3
    image = image.grey();

    image = image.cannyEdge(cannyParams); // default params
    console.log("canny", image);

    sobelPixels.current = Float32Array.from(image.data);

    sobelImage.loadPixels();
    for (let i = 0; i < w * h; i++) {
      // Assign same RGB cause its grayscale, only R is not zero
      sobelImage.pixels[i * 4] = sobelPixels.current[i];
      sobelImage.pixels[i * 4 + 1] = sobelPixels.current[i];
      sobelImage.pixels[i * 4 + 2] = sobelPixels.current[i];
      sobelImage.pixels[i * 4 + 3] = 255; // TODO: respect alpha?
    }

    console.log("sobelPixels SET: ", sobelPixels);
    sobelImage.updatePixels();
    p.image(sobelImage, 0, 0, p.width, p.height);

    p.draw = () => {}; // static image
  }, [imgSrc, globalThreshold, cannyParams]);

  // UPDATE threshold mask
  useEffect(() => {
    if (!maskP5Ref.current || !imgSrc) {
      return;
    }

    const p = maskP5Ref.current;

    let maskImage = p.createImage(imgSrc.width, imgSrc.height);
    // TODO: redundant, size is already known
    let [width, height] = getCanvasSizeForImage(maskImage);

    p.resizeCanvas(width, height);

    // Generate mask
    maskImage.loadPixels();

    // Compute based on original image (not sorted)
    let srcPixels = imgSrcPixelsOriginal.current;

    for (let i = 0; i < imgSrc.width * imgSrc.height; i++) {
      // TODO: use local threshold somehow?
      const pixelValue = aboveThreshold(srcPixels[i], globalThreshold)
        ? 255
        : 0;
      // Populate global thresholded pixels to be used for sorting
      threshPixels.current[i] = pixelValue;

      maskImage.pixels[i * 4 + 0] = pixelValue;
      maskImage.pixels[i * 4 + 1] = pixelValue;
      maskImage.pixels[i * 4 + 2] = pixelValue;
      maskImage.pixels[i * 4 + 3] = 255;
    }
    maskImage.updatePixels();
    p.image(maskImage, 0, 0, p.width, p.height);

    p.draw = () => {}; // static image
  }, [imgSrc, globalThreshold]);

  // RE-SORT on parameters changed
  useEffect(() => {
    sortImagePixelsDebounced();
  }, [globalThreshold, pipeline, cannyParams]);

  const getCanvasSizeForImage = (img: p5.Image) => {
    // Resize canvas based on image
    const [mw, mh] = maxCanvasSize;
    let ar = img.width / img.height;
    let width = img.width;
    let height = img.height;

    console.log("Image size: ", img.width, img.height);
    console.log("Max size: ", maxCanvasSize);

    // Calculate dimensions
    if (ar >= 1.0 && width > mw) {
      width = mw;
      height = width / ar;
    } else if (ar < 1.0 && height > mh) {
      height = mh;
      width = height * ar;
    }

    console.log("Set canvas size: ", width, height);

    return [width, height];
  };

  const handleLowThresholdChange = (newThreshold: number) => {
    setCannyParams((prev) => ({
      ...prev,
      lowThreshold:
        newThreshold > cannyParams.highThreshold
          ? cannyParams.highThreshold - 1
          : newThreshold
    }));
  };

  const handleHighThresholdChange = (newThreshold: number) => {
    setCannyParams((prev) => ({
      ...prev,
      highThreshold:
        newThreshold < cannyParams.lowThreshold
          ? cannyParams.lowThreshold + 1
          : newThreshold
    }));
  };

  const handlePipelineChange = useCallback((newPipeline: SortStep[]) => {
    setPipeline(newPipeline);
  }, []);

  const removeExtension = (filename: string): string => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  const handleSaveImage = () => {
    if (p5Ref.current) {
      // Access the saveCanvas method from the p5 instance
      let fileName = removeExtension(imageFile.name);
      fileName = fileName.toLowerCase();
      if (pipeline.length == 0) {
        console.log("Sort pipeline is empty!");
      }

      fileName += useEdgeDetection ? "_edge" : "_mask";

      for (const step of pipeline) {
        fileName += `_${step.direction}_${step.order}`;
      }
      let filename = fileName + `.png`; // -${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}
      imgSrc?.save(filename, "png");
    }
  };

  // SORT
  const sortImageWithPipeline = (pipeline: SortStep[]) => {
    // In / out buffer
    imgPixels = imgSrcPixelsOriginal.current.slice();

    if (pipeline.length == 0) {
      console.log("Sort pipeline is empty!");
    }

    for (const step of pipeline) {
      if (step.disabled) {
        console.log(`Skipping disabled step: ${step.direction}, ${step.order}`);
        continue; // Skip disabled steps
      }

      console.log(
        `Sorting: ${step.direction}, ${step.order}, threshold: ${step.threshold}`
      );

      let compareFn: SortCompareFn =
        step.order === "asc" ? (n1, n2) => n1 - n2 : (n1, n2) => n2 - n1;

      if (step.direction === "rows") {
        console.log("SORTING rows");
        sortRows(compareFn);
      } else if (step.direction === "cols") {
        console.log("SORTING columns");
        sortColumns(compareFn);
      } else if (step.direction === "diag") {
        console.log("SORTING diagonal");
        sortDiagonal(compareFn);
      }
    }

    unpackToP5Update(imgSrc!, imgPixels, imgSrc!.width, imgSrc!.height);
  };

  const sortImagePixelsDebounced = useDebouncedCallback(() => {
    sortImageWithPipeline(pipeline);
  }, sortImagePixelsDebounceDelayMs);

  const handleSortPixels = () => {
    if (!p5Ref.current || !imgSrc) {
      console.error(
        "handleSortPixels did not take effect: ",
        p5Ref.current,
        imgSrc
      );
      return;
    }
    sortImageWithPipeline(pipeline);
  };

  const handleGlobalThresholdChange = (newThreshold: number) => {
    setGlobalThreshold(newThreshold);
  };

  type SortCompareFn = (a: number, b: number) => number;

  const getGuidingPixels = (useSobel: boolean): Float32Array => {
    return useSobel
      ? sobelPixels.current
      : threshPixels.current.map((val) => {
          return 255 - val; // Invert thresh image cause edges are white
        });
  };

  const sortRows = (compareFn: SortCompareFn) => {
    let width = imgSrc!.width;
    let height = imgSrc!.height;

    let row = 0;
    while (row < height - 1) {
      let y = row;

      let unsorted = getArrayRow(imgPixels, y, width);

      let guidingPixels = getGuidingPixels(useEdgeDetection);

      guidingPixels = getArrayRow(guidingPixels, y, width);

      var ranges = getThresholdedRanges(guidingPixels);

      for (const [i_start, i_end] of ranges) {
        let sorted = unsorted.slice(i_start, i_end).sort(compareFn);

        for (let x = i_start; x < i_end; x++) {
          imgPixels[y * width + x] = sorted[x - i_start];
        }
      }
      row++;
    }
  };

  const sortColumns = (compareFn: SortCompareFn) => {
    let width = imgSrc!.width;
    let height = imgSrc!.height;

    let col = 0;
    while (col < width) {
      // current column
      let x = col;

      let unsorted = getArrayColumn(imgPixels, x, width, height);

      let guidingPixels = getGuidingPixels(useEdgeDetection);

      guidingPixels = getArrayColumn(guidingPixels, x, width, height);

      // Apply threshold
      var ranges = getThresholdedRanges(guidingPixels);

      for (const [i_start, i_end] of ranges) {
        let sorted = unsorted.slice(i_start, i_end).sort(compareFn);

        for (let y = i_start; y < i_end; y++) {
          imgPixels[x + y * width] = sorted[y - i_start];
        }
      }
      col++;
    }
  };

  const sortDiagonal = (compareFn: SortCompareFn) => {
    let width = imgSrc!.width;
    let height = imgSrc!.height;

    for (let d = 0; d < width + height - 2; d++) {
      let unsorted = getArrayDiagonal(imgPixels, d, width, height);

      // Apply threshold
      let guidingPixels = getGuidingPixels(useEdgeDetection);

      guidingPixels = getArrayDiagonal(guidingPixels, d, width, height);

      let ranges = getThresholdedRanges(guidingPixels);

      let yStart = Math.max(0, d - width + 1);
      let yEnd = Math.min(height - 1, d);

      for (const [i_start, i_end] of ranges) {
        let sorted = unsorted.slice(i_start, i_end).sort(compareFn);

        let i = 0;
        for (let y = yStart; y <= yEnd; y++) {
          let x = d - y;

          if (x >= width || y >= height) {
            throw new Error("Overflow (x,y): " + x + "" + y);
          }

          if (i >= i_start && i < i_end) {
            let i_sorted = i - i_start;
            imgPixels[x + y * width] = sorted[i_sorted];
          }
          i++;
        }
      }
    }
  };

  const getThresholdedRanges = (
    rowPixels: Float32Array
  ): [number, number][] => {
    const ranges: [number, number][] = [];
    let insideEdge = false;
    let start_i: number = 0;

    let i = 0;
    for (; i < rowPixels.length; i++) {
      const px = rowPixels[i];

      if (px === 255) {
        if (insideEdge) {
          continue;
        }

        // entered edge, add range before
        if (i != start_i) {
          // could be equal on element 0
          // add range
          ranges.push([start_i, i]); // end exclusive
        }

        insideEdge = true;
      } else {
        // encountered black
        if (!insideEdge) {
          continue;
        }
        // exited edge, record start index of next range
        start_i = i;

        insideEdge = false;
      }
    }

    // if not inside edge at the end, add last range
    if (!insideEdge) {
      if (i == start_i) {
        // cant happen
        console.error(
          "getThresholdedRanges zero range at end, start_i: ",
          start_i
        );
      }

      ranges.push([start_i, i]); // end exclusive
    }

    return ranges;
  };

  const unpackToP5Update = (
    p5img: p5.Image,
    packed: Float32Array,
    w: number,
    h: number
  ) => {
    // Update image pixels
    let i = 0;
    while (i < 4 * w * h) {
      let col = packed[Math.floor(i / 4)];
      p5img.pixels[i++] = (col >> 16) & 255;
      p5img.pixels[i++] = (col >> 8) & 255;
      p5img.pixels[i++] = col & 255;
      p5img.pixels[i++] = 255;
    }

    // Push the changes
    p5img.updatePixels();
  };

  const packFromP5 = (
    packed: Float32Array,
    p5img: p5.Image,
    w: number,
    h: number
  ) => {
    for (let i = 0; i < 4 * (w * h); i += 4) {
      packed[Math.floor(i / 4)] =
        (255 << 24) |
        (p5img.pixels[i] << 16) |
        (p5img.pixels[i + 1] << 8) |
        p5img.pixels[i + 2];
    }
  };

  const aboveThreshold = (pixel: number, threshold: number) => {
    let [r, g, b] = getRGB(pixel);
    let br = getBrightness(r, g, b);

    return br >= threshold;
  };

  const getBrightness = (r: number, g: number, b: number): number => {
    // Returns range 0-255
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  const getRGB = (px: number) => {
    let r = px & 255;
    let g = (px >> 8) & 255;
    let b = (px >> 16) & 255;
    return [r, g, b];
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Pixel Sorter</h1>

      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Left column: Controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            minWidth: "250px"
          }}
        >
          <StyledButton onClick={onGoBack}>Go Back</StyledButton>
          <StyledButton onClick={handleSortPixels}>Sort Pixels</StyledButton>
          <StyledButton onClick={handleSaveImage}>Save Image</StyledButton>
          {
            /* Sort mode toggle */
            <ToggleButtonGroup>
              <ToggleButton
                active={!useEdgeDetection}
                onClick={() => setUseEdgeDetection(false)}
              >
                Threshold Mask
              </ToggleButton>
              <ToggleButton
                active={useEdgeDetection}
                onClick={() => setUseEdgeDetection(true)}
              >
                Edge Detection
              </ToggleButton>
            </ToggleButtonGroup>
          }
          {!useEdgeDetection && (
            <ThresholdControl
              name="Threshold"
              threshold={globalThreshold}
              onThresholdChange={handleGlobalThresholdChange}
            />
          )}
          {useEdgeDetection && (
            <div style={{ display: "flex", flexDirection: "row", gap: "1em" }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  gap: "1em"
                }}
              >
                {
                  /* Tooltip */
                  <TooltipContainer>
                    <TooltipIcon title="Low Threshold">ⓘ</TooltipIcon>
                    <TooltipText>
                      <strong>High Threshold: </strong>
                      Pixels above this threshold are classified as strong
                      edges.
                      <br />
                      <strong>Low Threshold: </strong>
                      Pixels below this threshold are classified as non-edges
                      (or suppressed). Helps get rid of noise.
                      <br />
                      <strong>Between Thresholds: </strong>
                      Pixels become edges if they are connected to strong edges.
                    </TooltipText>
                  </TooltipContainer>
                }
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "1em" }}
              >
                <ThresholdControl
                  name="Low Threshold"
                  threshold={cannyParams.lowThreshold}
                  onThresholdChange={handleLowThresholdChange}
                />

                <ThresholdControl
                  name="High Threshold"
                  threshold={cannyParams.highThreshold}
                  onThresholdChange={handleHighThresholdChange}
                />
              </div>
            </div>
          )}
          <SortPipeline
            pipeline={pipeline}
            globalThreshold={globalThreshold}
            onPipelineChange={handlePipelineChange}
          />
        </div>

        <div className="canvas-container">
          <PreviewContainer>
            <PreviewCaption>Result</PreviewCaption>
            <CanvasWrapper>
              <div ref={p5ParentRef}></div>
            </CanvasWrapper>
          </PreviewContainer>

          <CollapsiblePreview isVisible={!useEdgeDetection} open>
            <CollapsibleSummary>Threshold Mask Preview</CollapsibleSummary>
            <CollapsibleContent>
              <CanvasWrapper>
                <div ref={maskCanvasRef}></div>
              </CanvasWrapper>
            </CollapsibleContent>
          </CollapsiblePreview>

          <CollapsiblePreview isVisible={useEdgeDetection} open>
            <CollapsibleSummary>Edge Map Preview</CollapsibleSummary>
            <CollapsibleContent>
              <CanvasWrapper>
                <div ref={edgeCanvasRef}></div>
              </CanvasWrapper>
            </CollapsibleContent>
          </CollapsiblePreview>
        </div>
      </div>
    </div>
  );
};
