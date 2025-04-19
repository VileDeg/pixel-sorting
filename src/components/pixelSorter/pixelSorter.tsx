import { useState, useRef, useEffect, useCallback } from 'react';
import p5 from 'p5';
import { useDropzone } from 'react-dropzone';
import { useDebouncedCallback } from "use-debounce";
import { StyledButton } from './styles.ts';

import { SortOrderToggle } from "../sortOrderToggle/sortOrderToggle.tsx";
import { ThresholdControl } from "../thresholdControl/thresholdControl.tsx";



export const PixelSorter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const [imgSrc, setImgSrc] = useState<p5.Image | null>(null);

  const [threshold, setThreshold] = useState(100);  // slider value

  const [sortOptions, setSortOptions] = useState({
    rows: { enabled: true, order: 1 },
    columns: { enabled: true, order: 2 },
  });


  const p5ParentRef = useRef<HTMLDivElement>(document.createElement('div')); //new HTMLElement
  const p5Ref = useRef<p5 | null>(null);

  const maskCanvasRef = useRef<HTMLDivElement>(document.createElement('div'));
  const maskP5Ref = useRef<p5 | null>(null);

  const defaultCanvasSize = [200, 200];
  const maxCanvasSize = [640, 640];

  const imgSrcPixelsOriginal = useRef<number[]>([]); // stored imgSrc pixels to reapply sort

  const sortImagePixelsDebounceDelayMs = 200;

  type SortDirection = 'orthogonal' | 'diagonal' | 'reverse-diagonal';

  const [sortDirection, setSortDirection] = useState<SortDirection>('orthogonal');


  let imgPixels: number[] = [];    // packed RGB of sorted image

  // threshold values to determine sorting start and end pixels
  // const blackValue = useRef(0xFF000000);
  let brightnessValue;
  let whiteValue;

  let row = 0;
  let column = 0;



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
        const pixelValue = src[i] >= getBlackValue() ? 255 : 0;

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
  }, [imgSrc, threshold]); // isImageLoaded


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

  const halfSort = (sortRows: boolean) => {
    if (sortRows) {
      row = 0;
      // loop through rows
      while (row < imgSrc!.height - 1) {
        sortRow();
        row++;
      }
    } else {
      column = 0;
      // loop through columns
      while (column < imgSrc!.width - 1) {
        sortColumn();
        column++;
      }
    }
  };

  // SORT
  const sortImagePixels = () => {
    imgPixels = imgSrcPixelsOriginal.current.slice();

    if (sortDirection == 'orthogonal') {
      if (sortOptions.rows.enabled && sortOptions.rows.order === 1) {
        // Sort rows first
        console.log("1 SORTING rows");
        halfSort(true);
        if (sortOptions.columns.enabled) {
          console.log("2 SORTING cols");
          halfSort(false);
        }
      }
      if (sortOptions.columns.enabled && sortOptions.columns.order === 1) {
        // Sort columns first
        console.log("1 SORTING cols");
        halfSort(false);
        if (sortOptions.rows.enabled) {
          console.log("2 SORTING rows");
          halfSort(true);
        }
      }
      if (!sortOptions.rows.enabled && !sortOptions.columns.enabled) {
        console.error("Invalid mode.");
      }
    } else if (sortDirection == 'diagonal') {
      console.log("SORTING diagonal");
      sortDiagonal();
    }

    let imageBytes = 4 * (imgSrc!.width * imgSrc!.height);

    // Update image pixels
    //imgSrc!.loadPixels();
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
    useDebouncedCallback(sortImagePixels, sortImagePixelsDebounceDelayMs);

  const handleSortPixels = () => {
    if (!p5Ref.current || !imgSrc) {
      console.error("handleSortPixels did not take effect: ", p5Ref.current, imgSrc);
      return;
    }
    // Update black based on threshold
    //setBlackValue();
    // TODO: 
    // Trigger rerender of image
    //setRerenderKey(k => k + 1);
    // console.log("handleSortPixels: imgSrc.pixels: ", imgSrc.pixels);
    // console.log("handleSortPixels: imgSrcPixelsOriginal: ", imgSrcPixelsOriginal.current);

    sortImagePixels();
  }

  const handleToggleSortOption = (key: 'rows' | 'columns') => {
    setSortOptions((prev) => {
      const current = prev[key];
      const otherKey = key === 'rows' ? 'columns' : 'rows';
      const other = prev[otherKey];

      if (current.enabled && other.enabled) {
        // Disable current, shift other to order 1
        return {
          ...prev,
          [key]: { enabled: false, order: null },
          [otherKey]: { ...other, order: 1 },
        };
      } else if (!current.enabled && !other.enabled) {
        // Enable current as first (1)
        return {
          ...prev,
          [key]: { enabled: true, order: 1 },
        };
      } else if (!current.enabled && other.enabled) {
        // Enable current as second (2)
        return {
          ...prev,
          [key]: { enabled: true, order: 2 },
        };
      } else {
        // Disabling the only enabled one → keep at least one enabled
        return prev;
      }
    });
  };

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);

    // Auto-sort on change
    //sortImagePixels();
    sortImagePixelsDebounced();
  };

  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as SortDirection;
    setSortDirection(value);
  };


  const getBlackValue = () => {
    // TODO: maybe refactor to increase performance
    let byte = threshold & 255;
    // Full alpha
    let blackValue = byte | byte << 8 | byte << 16 | 255 << 24;
    return blackValue;
  };


  const sortRow = () => {
    let width = imgSrc!.width;
    // current row
    let y = row;
    let iRow = y * width; // imgSrc!.width

    // where to start sorting
    let x = 0;

    // where to stop sorting
    let xend = 0;

    while (xend < width - 1) {
      x = getFirstNotBlackX(x, y);
      xend = getNextBlackX(x, y);

      if (x < 0) break;

      let sortLength = xend - x;

      let unsorted = [];
      let sorted = [];

      for (let i = 0; i < sortLength; i++) {
        unsorted[i] = imgPixels[x + i + iRow];
      }

      sorted = unsorted.sort((n1, n2) => n1 - n2);

      for (let i = 0; i < sortLength; i++) {
        imgPixels[x + i + iRow] = sorted[i];
      }

      x = xend + 1;
    }
  }

  const sortColumn = () => {
    let width = imgSrc!.width;
    let height = imgSrc!.height;
    // current column
    let x = column;

    // where to start sorting
    let y = 0;

    // where to stop sorting
    let yend = 0;

    while (yend < height - 1) {
      y = getFirstNotBlackY(x, y);
      yend = getNextBlackY(x, y);

      if (y < 0) break;

      let sortLength = yend - y;

      let unsorted = [];
      let sorted = [];

      for (let i = 0; i < sortLength; i++) {
        unsorted[i] = imgPixels[x + (y + i) * width];
      }

      sorted = unsorted.sort((n1, n2) => n1 - n2);

      for (let i = 0; i < sortLength; i++) {
        imgPixels[x + (y + i) * width] = sorted[i];
      }

      y = yend + 1;
    }
  }
  const sortDiagonal = () => {
    // TODO: apply threshold
    let width = imgSrc!.width;
    let height = imgSrc!.height;

    for (let d = 0; d < width + height - 2; d++) {
      let unsorted = [];
      //let sorted = [];

      let i = 0;
      // Limit y to optimize
      let yStart = Math.max(0, d - width + 1);
      let yEnd = Math.min(height - 1, d);
      for (let y = yStart; y <= yEnd; y++) {
        let x = d - y;

        //let iRow = y * width;

        if (x >= width || y >= height) {
          throw new Error("Overflow (x,y): " + x + '' + y);
        }

        unsorted[i] = imgPixels[x + y * width];
        i++;
      }

      // Apply threshold
      let i_start = 0;
      let i_end = 0;
      while (i_end < unsorted.length - 1) {
        i_start = getFirstNotBlackI_Modif(unsorted, i_start);
        i_end = getNextBlackI_Modif(unsorted, i_start);

        // TODO: end inclusive?
        let sorted = unsorted.slice(i_start, i_end).sort((n1, n2) => n1 - n2);

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
        i_start = i_end + 1;
      }
    }
  }

  const getFirstNotBlackI_Modif = (pixels: number[], start_i: number) => {
    // pixels is 1D array of extracted pixels from image
    let i = start_i;
    while (pixels[i] < getBlackValue()) {
      i++; // is black
      if (i >= imgSrc!.width)
        return -1;
    }
    return i;
  }

  const getNextBlackI_Modif = (pixels: number[], start_i: number) => {
    // pixels is 1D array of extracted pixels from image
    let i = start_i + 1;
    while (pixels[i] > getBlackValue()) {
      i++; // not black
      if (i >= imgSrc!.width)
        return imgSrc!.width - 1;
    }
    return i - 1;
  }


  // black x
  const getFirstNotBlackX = (x: number, y: number) => {
    let iRow = y * imgSrc!.width;
    while (imgPixels[x + iRow] < getBlackValue()) {
      x++;
      if (x >= imgSrc!.width)
        return -1;
    }
    return x;
  }


  const getNextBlackX = (x: number, y: number) => {
    x++;
    let iRow = y * imgSrc!.width;
    while (imgPixels[x + iRow] > getBlackValue()) {
      x++;
      if (x >= imgSrc!.width)
        return imgSrc!.width - 1;
    }
    return x - 1;
  }


  // black y
  const getFirstNotBlackY = (x: number, y: number) => {
    if (y < imgSrc!.height) {
      while (imgPixels[x + y * imgSrc!.width] < getBlackValue()) {
        y++;
        if (y >= imgSrc!.height)
          return -1;
      }
    }
    return y;
  }


  const getNextBlackY = (x: number, y: number) => {
    y++;
    if (y < imgSrc!.height) {
      while (imgPixels[x + y * imgSrc!.width] > getBlackValue()) {
        y++;
        if (y >= imgSrc!.height)
          return imgSrc!.height - 1;
      }
    }
    return y - 1;
  }


  // brightness x
  // const getFirstBrightX = (x: number, y: number) => {
  //   let iRow = y * imgSrc!.width;
  //   while (brightness2(imgPixels[x + iRow]) < brightnessValue) {
  //     x++;
  //     if (x >= width)
  //       return -1;
  //   }
  //   return x;
  // }


  // const getNextDarkX(_x, _y) {
  //   let x = _x + 1;
  //   let y = _y;

  //   let iRow = y * imgSrc!.width;
  //   while (brightness2(imgPixels[x + iRow]) > brightnessValue) {
  //     x++;
  //     if (x >= width) return width - 1;
  //   }
  //   return x - 1;
  // }


  // // white x
  // const getFirstNotWhiteX = (x: number, y: number) => {
  //   let iRow = y * imgSrc!.width;
  //   while (imgPixels[x + iRow] > whiteValue) {
  //     x++;
  //     if (x >= width)
  //       return -1;
  //   }
  //   return x;
  // }


  // const getNextWhiteX = (x: number, y: number) => {
  //   x++;
  //   let iRow = y * imgSrc!.width;
  //   while (imgPixels[x + iRow] < whiteValue) {
  //     x++;
  //     if (x >= width)
  //       return width - 1;
  //   }
  //   return x - 1;
  // }




  // // brightness y
  // const getFirstBrightY = (x: number, y: number) => {
  //   if (y < height) {
  //     while (brightness2(imgPixels[x + y * imgSrc!.width]) < brightnessValue) {
  //       y++;
  //       if (y >= height)
  //         return -1;
  //     }
  //   }
  //   return y;
  // }


  // const getNextDarkY = (x: number, y: number) => {
  //   y++;
  //   if (y < height) {
  //     while (brightness2(imgPixels[x + y * imgSrc!.width]) > brightnessValue) {
  //       y++;
  //       if (y >= height)
  //         return height - 1;
  //     }
  //   }
  //   return y - 1;
  // }


  // // white y
  // const getFirstNotWhiteY = (x: number, y: number) => {
  //   if (y < height) {
  //     while (imgPixels[x + y * imgSrc!.width] > whiteValue) {
  //       y++;
  //       if (y >= height)
  //         return -1;
  //     }
  //   }
  //   return y;
  // }


  // const getNextWhiteY = (x: number, y: number) => {
  //   y++;
  //   if (y < height) {
  //     while (imgPixels[x + y * imgSrc!.width] < whiteValue) {
  //       y++;
  //       if (y >= height)
  //         return height - 1;
  //     }
  //   }
  //   return y - 1;
  // }


  // const brightness2 = (col: number) => {
  //   return (((col >> 16) & 255) + ((col >> 8) & 255) + (col & 255)) / 3;
  // }

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
              <ThresholdControl threshold={threshold} onThresholdChange={handleThresholdChange} />
              {sortDirection == 'orthogonal' &&
                <SortOrderToggle
                  rows={sortOptions.rows}
                  columns={sortOptions.columns}
                  onToggle={handleToggleSortOption}
                />
              }
              <label>
                Sort Direction:
                <select value={sortDirection} onChange={handleDirectionChange}>
                  <option value="orthogonal">Orthogonal (→)</option>
                  <option value="diagonal">Diagonal (↘)</option>
                  <option value="reverse-diagonal">Reverse Diagonal (↙)</option>
                </select>
              </label>
            </>
          )}
        </div>

        {/* Right column: Canvas */}
        <div className="canvas-container">
          <div ref={p5ParentRef}></div>
          <div style={{ marginTop: '1rem' }}>
            <h3>Threshold Mask Preview</h3>
            <div ref={maskCanvasRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
