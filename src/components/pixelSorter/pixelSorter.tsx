import { useState, useRef, useEffect, useCallback } from 'react';
import p5 from 'p5';
import { useDropzone } from 'react-dropzone';
import { useDebouncedCallback } from "use-debounce";
import { StyledButton } from './styles.ts';

import { SortOrderToggle } from "../sortOrderToggle/sortOrderToggle";
import { ThresholdControl } from "../common/thresholdControl/thresholdControl.tsx";

import { SortStep, SortPipeline } from "../sortPipeline/sortPipeline";



export const PixelSorter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<p5.Image | null>(null);

  const [globalThreshold, setGlobalThreshold] = useState(100);  // slider value

  // const [sortOptions, setSortOptions] = useState({
  //   rows: { enabled: true, order: 1 },
  //   columns: { enabled: true, order: 2 },
  // });

  const [pipeline, setPipeline] = useState<SortStep[]>([]);

  const handlePipelineChange = useCallback((newPipeline: SortStep[]) => {
    setPipeline(newPipeline);
    //sortImageWithPipeline(newPipeline); // call sorting logic here
  }, []);


  const p5ParentRef = useRef<HTMLDivElement>(document.createElement('div'));
  const p5Ref = useRef<p5 | null>(null);

  const maskCanvasRef = useRef<HTMLDivElement>(document.createElement('div'));
  const maskP5Ref = useRef<p5 | null>(null);

  const defaultCanvasSize = [200, 200];
  const maxCanvasSize = [640, 640];

  const imgSrcPixelsOriginal = useRef<number[]>([]); // stored imgSrc pixels to reapply sort

  const sortImagePixelsDebounceDelayMs = 200;

  type SortDirection = 'orthogonal' | 'diagonal' | 'reverse-diagonal';

  //const [sortDirection, setSortDirection] = useState<SortDirection>('orthogonal');


  let imgPixels: number[] = [];    // packed RGB of sorted image


  const onDrop = useCallback((acceptedFiles: Array<File>) => {
    uploadImage(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: {
      'image/*': [],
    }
  })


  useEffect(() => {
    console.log("useEffect ON CANVAS CREATE (ATTACH TO DOM)");

    const sketch = (p: p5) => {

      p.setup = () => {
        p.pixelDensity(1); // 1 pixel = 1 pixel on canvas
        let [w, h] = defaultCanvasSize;
        p.createCanvas(w, h);
        p.background(240);
      };

      p.draw = () => { };
    };

    // Create a new p5 instance and attach it to the sketchRef
    p5Ref.current = new p5(sketch, p5ParentRef.current);

    // Cleanup on unmount
    return () => {
      console.log("CLEANUP useEffect ON CANVAS CREATE");
      p5Ref.current?.remove();
      //setIsImageLoaded(false);
    };
  }, []); // No dependency (is run just once)

  // CREATE threshold mask canvas
  useEffect(() => {
    const sketch = (p: p5) => {
      p.setup = () => {
        p.pixelDensity(1);
        let [w, h] = defaultCanvasSize;
        p.createCanvas(w, h);
        p.background(240);
      };

      p.draw = () => { };
    };

    maskP5Ref.current?.remove(); // Clean up previous canvas
    maskP5Ref.current = new p5(sketch, maskCanvasRef.current);


    return () => {
      maskP5Ref.current?.remove();
    };
  }, []); // No dependency (is run just once)


  // ON IMAGE UPLOAD
  useEffect(() => {
    if (!p5Ref.current || !imageFile) {
      return;
    }

    console.log("useEffect ON IMAGE UPLOAD");

    const p = p5Ref.current;

    // Load the image
    const imageUrl = URL.createObjectURL(imageFile!);
    p.loadImage(imageUrl, (loadedImg) => {
      // Handle successful image load
      URL.revokeObjectURL(imageUrl);

      // Resize canvas based on image
      let [width, height] = getCanvasSizeForImage(loadedImg);
      // Resize canvas
      p.resizeCanvas(width, height);

      // TODO
      loadedImg.loadPixels(); // <- Ensure pixels are loaded BEFORE setting state
      // populate
      populateOriginalPixels(loadedImg);

      setImgSrc(loadedImg); // Now it’s safe
      setIsImageLoaded(true);

      // Override draw function to display image
      p.draw = () => {
        // Must stay in draw to be updated on sort!
        p.image(loadedImg, 0, 0, p.width, p.height);
      };

    }, (error) => {
      console.log("Failed to load image");
      setIsImageLoaded(false);
      URL.revokeObjectURL(imageUrl);
    });
    console.log("IMAGE LOADED: ", imgSrc);
  }, [imageFile]); // , rerenderKey, threshold

  // UPDATE threshold mask
  useEffect(() => {
    if (!maskP5Ref.current || !imgSrc || !isImageLoaded) {
      return;
    }

    const p = maskP5Ref.current;

    let maskImage: p5.Image;

    maskImage = p.createImage(imgSrc.width, imgSrc.height);
    let [width, height] = getCanvasSizeForImage(maskImage);

    p.resizeCanvas(width, height);

    const generateMask = () => {
      maskImage.loadPixels();

      // Compute based on original image (not sorted)
      let src = imgSrcPixelsOriginal.current;

      for (let i = 0; i < imgSrc.width * imgSrc.height; i++) {
        const pixelValue = aboveThreshold(src[i], globalThreshold) ? 255 : 0;

        maskImage.pixels[i * 4 + 0] = pixelValue;
        maskImage.pixels[i * 4 + 1] = pixelValue;
        maskImage.pixels[i * 4 + 2] = pixelValue;
        maskImage.pixels[i * 4 + 3] = 255;
      }
      maskImage.updatePixels();
      p.image(maskImage, 0, 0, p.width, p.height);
    };


    generateMask();

    p.draw = () => { }; // static image
  }, [imgSrc, globalThreshold]); // isImageLoaded


  const populateOriginalPixels = (imgSrc: p5.Image) => {
    if (!imgSrc) {
      return;
    }

    console.log("useEffect ON IMAGE LOAD (p5)");
    // Store original pixels in case of repeated sort
    //imgSrc.loadPixels();

    for (let i = 0; i < 4 * (imgSrc.width * imgSrc.height); i += 4) {
      imgSrcPixelsOriginal.current[Math.floor(i / 4)] =
        (255 << 24) |
        (imgSrc.pixels[i] << 16) |
        (imgSrc.pixels[i + 1] << 8) |
        (imgSrc.pixels[i + 2]);
    }

    //imgSrcPixelsOriginal.current = imgSrc.pixels.slice();
    console.log("useEffect: imgSrc.pixels: ", imgSrc.pixels);
    console.log("useEffect: imgSrcPixelsOriginal: ", imgSrcPixelsOriginal.current);
  }


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
  }



  const uploadImage = (file: File | undefined) => {
    if (file) {
      setImageFile(file);
      //setRerenderKey(0); // 0 means image just loaded
      console.log("handleImageUpload: ", imageFile)
    } else {
      console.error("File is null");
    }
  }

  const handleSaveImage = () => {
    if (p5Ref.current) {
      // Access the saveCanvas method from the p5 instance
      //p5Ref.current.saveCanvas();
      let filename = `pixel-sorted-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      imgSrc?.save(filename, 'png');
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
      console.log(
        `Sorting: ${step.direction}, ${step.order}, threshold: ${step.threshold}`
      );

      let threshold = step.useLocalThreshold ? step.threshold! : globalThreshold;

      let compareFn: SortCompareFn =
        step.order === "asc" ? (n1, n2) => n1 - n2 : (n1, n2) => n2 - n1;

      if (step.direction === "rows") {
        console.log("SORTING rows");
        sortRows(threshold, compareFn);
      } else if (step.direction === "columns") {
        console.log("SORTING columns");
        sortColumns(threshold, compareFn);
      } else if (step.direction === "diagonal") {
        console.log("SORTING diagonal");
        sortDiagonal(threshold, compareFn);
      }
    }

    let imageBytes = 4 * (imgSrc!.width * imgSrc!.height);

    // Update image pixels
    let i = 0;
    while (i < imageBytes) {
      let col = imgPixels[Math.floor(i / 4)];
      imgSrc!.pixels[i++] = col >> 16 & 255;
      imgSrc!.pixels[i++] = col >> 8 & 255;
      imgSrc!.pixels[i++] = col & 255;
      imgSrc!.pixels[i++] = 255;
    }

    // Push the changes
    imgSrc!.updatePixels();
  };

  const sortImagePixelsDebounced =
    useDebouncedCallback(() => { sortImageWithPipeline(pipeline) }, sortImagePixelsDebounceDelayMs);

  const handleSortPixels = () => {
    if (!p5Ref.current || !imgSrc) {
      console.error("handleSortPixels did not take effect: ", p5Ref.current, imgSrc);
      return;
    }
    sortImageWithPipeline(pipeline);
  }

  // const handleToggleSortOption = (key: 'rows' | 'columns') => {
  //   setSortOptions((prev) => {
  //     const current = prev[key];
  //     const otherKey = key === 'rows' ? 'columns' : 'rows';
  //     const other = prev[otherKey];

  //     if (current.enabled && other.enabled) {
  //       // Disable current, shift other to order 1
  //       return {
  //         ...prev,
  //         [key]: { enabled: false, order: null },
  //         [otherKey]: { ...other, order: 1 },
  //       };
  //     } else if (!current.enabled && !other.enabled) {
  //       // Enable current as first (1)
  //       return {
  //         ...prev,
  //         [key]: { enabled: true, order: 1 },
  //       };
  //     } else if (!current.enabled && other.enabled) {
  //       // Enable current as second (2)
  //       return {
  //         ...prev,
  //         [key]: { enabled: true, order: 2 },
  //       };
  //     } else {
  //       // Disabling the only enabled one → keep at least one enabled
  //       return prev;
  //     }
  //   });
  // };

  const handleThresholdChange = (newThreshold: number) => {
    setGlobalThreshold(newThreshold);

    // Auto-sort on change
    //sortImagePixels();
    sortImagePixelsDebounced();
  };

  // const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const value = e.target.value as SortDirection;
  //   setSortDirection(value);
  // };


  // const getBlackValue = (threshold: number) => {
  //   // TODO: maybe refactor to increase performance
  //   let byte = threshold & 255;
  //   // Full alpha
  //   let blackValue = byte | byte << 8 | byte << 16 | 255 << 24;
  //   return blackValue;
  // };

  const getThresholdBrighness = (threshold: number) => {
    //return threshold / 255.0;
    return threshold;
  };

  type SortCompareFn = (a: number, b: number) => number;

  const sortRows = (threshold: number, compareFn: SortCompareFn) => {
    // threshold = 0;
    let width = imgSrc!.width;
    let height = imgSrc!.height;

    let row = 0;
    while (row < height - 1) {


      let y = row;
      let unsorted = imgPixels.slice(y * width, y * width + width);

      // Apply threshold
      let ranges = getThresholdedRanges(unsorted, threshold);
      for (const [i_start, i_end] of ranges) {
        if (threshold == 0 && (i_start != 0 || i_end != width - 1)) {
          console.error("Invalid threshold range: ", i_start, i_end);
        }
        let sorted = unsorted.slice(i_start, i_end).sort(compareFn);

        for (let x = i_start; x < i_end; x++) {
          imgPixels[y * width + x] = sorted[x - i_start];
        }
      }
      row++;
    }
  }

  const sortColumns = (threshold: number, compareFn: SortCompareFn) => {
    let width = imgSrc!.width;
    let height = imgSrc!.height;

    let col = 0;
    while (col < width) {
      // current column
      let x = col;

      let unsorted = [];
      // Can't use slice cause pixels array is row-major
      for (let y = 0; y < height; y++) {
        unsorted[y] = imgPixels[x + (y) * width];
      }

      // Apply threshold
      let ranges = getThresholdedRanges(unsorted, threshold);

      for (const [i_start, i_end] of ranges) {
        let sorted = unsorted.slice(i_start, i_end).sort(compareFn);

        for (let y = i_start; y < i_end; y++) {
          imgPixels[x + (y) * width] = sorted[y - i_start];
        }
      }
      col++;
    }
  }

  const sortDiagonal = (threshold: number, compareFn: SortCompareFn) => {
    let width = imgSrc!.width;
    let height = imgSrc!.height;

    for (let d = 0; d < width + height - 2; d++) {
      let unsorted = [];

      let i = 0;
      // Limit y to optimize
      let yStart = Math.max(0, d - width + 1);
      let yEnd = Math.min(height - 1, d);
      for (let y = yStart; y <= yEnd; y++) {
        let x = d - y;

        if (x >= width || y >= height) {
          throw new Error("Overflow (x,y): " + x + '' + y);
        }

        unsorted[i] = imgPixels[x + y * width];
        i++;
      }

      // Apply threshold
      let ranges = getThresholdedRanges(unsorted, threshold);

      for (const [i_start, i_end] of ranges) {
        let sorted = unsorted.slice(i_start, i_end).sort(compareFn);

        i = 0;
        for (let y = yStart; y <= yEnd; y++) {
          let x = d - y;

          //let iRow = y * width;
          if (x >= width || y >= height) {
            throw new Error("Overflow (x,y): " + x + '' + y);
          }

          if (i >= i_start && i < i_end) {
            let i_sorted = i - i_start;
            imgPixels[x + y * width] = sorted[i_sorted];
          }
          i++;
        }
      }
    }
  }



  const getThresholdedRanges = (pixels: number[], threshold: number) => {
    // pixels is 1D array of extracted pixels from image
    let i_start = 0;
    let i_end = 0;

    // Array of tuples (start_i, end_i)
    let ranges = [];

    while (i_end < pixels.length - 1) {
      // Get first not black

      if (i_start < 0) {
        // All values in this segment are under threshold
        break;
      }

      let i = i_start;
      while (!aboveThreshold(pixels[i], threshold)) {
        i++; // is black
        if (i >= imgSrc!.width) {
          //console.error("getThresholdedRanges: overflow");
          i_start = -1;
          break;
        }
      }
      i_start = i;

      // Get next black

      i++;
      while (aboveThreshold(pixels[i], threshold)) {
        i++; // not black
        if (i >= imgSrc!.width) {
          i_end = imgSrc!.width - 1;
          break;
        }
      }
      i_end = i - 1;

      ranges.push([i_start, i_end]);

      i_start = i_end + 1;
    }
    return ranges;
  }

  const aboveThreshold = (pixel: number, threshold: number) => {
    let [r, g, b] = getRGB(pixel);
    let br = getBrightness(r, g, b);
    //return pixel >= getBlackValue(threshold);
    return br >= getThresholdBrighness(threshold);
  }

  function getBrightness(r: number, g: number, b: number): number {
    // Returns range 0-255
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function getRGB(px: number) {
    let r = px & 255;
    let g = (px >> 8) & 255;
    let b = (px >> 16) & 255;
    return [r, g, b];
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Pixel Sorter</h1>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Left column: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '250px' }}>
          <div /* Dropzone */
            {...getRootProps()}
            style={{
              padding: '1rem',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop an image here, or click to select</p>
            )}
          </div>

          {isImageLoaded && (
            <>
              <StyledButton onClick={handleSortPixels}>Sort Pixels</StyledButton>
              <StyledButton onClick={handleSaveImage}>Save Image</StyledButton>
              <ThresholdControl threshold={globalThreshold} onThresholdChange={handleThresholdChange} />
              <SortPipeline pipeline={pipeline} globalThreshold={globalThreshold} onPipelineChange={handlePipelineChange} />
              {/* <label>
                Sort Direction:
                <select value={sortDirection} onChange={handleDirectionChange}>
                  <option value="orthogonal">Orthogonal (→)</option>
                  <option value="diagonal">Diagonal (↘)</option>
                  <option value="reverse-diagonal">Reverse Diagonal (↙)</option>
                </select>
              </label>
              {sortDirection == 'orthogonal' &&
                <SortOrderToggle
                  rows={sortOptions.rows}
                  columns={sortOptions.columns}
                  onToggle={handleToggleSortOption}
                />
              } */}

            </>
          )}
        </div>

        {/* Right column: Canvas */}
        <div className="canvas-container">
          <div ref={p5ParentRef}></div>

          <details open>
            <summary>Click to expand</summary>
            <div className="content" style={{ marginTop: '1rem' }}>
              <h3>Threshold Mask Preview</h3>
              <div ref={maskCanvasRef}></div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
