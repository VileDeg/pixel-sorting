import { useState, useRef, useEffect, useCallback } from 'react'
import p5 from 'p5';
import { useDropzone } from 'react-dropzone'
import { DownloadButton, SortButton } from './styles.ts'

export const PixelSorter: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);

  const [threshold, setThreshold] = useState(100);  // slider value

  const [rerenderKey, setRerenderKey] = useState(0);

  const p5ParentRef = useRef(document.createElement('div')); //new HTMLElement
  const p5Ref = useRef<p5 | null>(null);

  const maxCanvasSize = [1024, 1024];

  // === Pixel sort
  let mode = 0;

  let imgSrc: p5.Image | null = null;            // source image  
  let imgSrcPixels: number[] = []; // packed RGB of source image
  let imgPixels: number[] = [];    // packed RGB of sorted image

  // threshold values to determine sorting start and end pixels
  let blackValue = 0xFF000000;
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
    console.log("useEffect sketch");

    const sketch = (p: p5) => {

      p.preload = () => {
        if (!imageFile) {
          return;
        }
        const imageUrl = URL.createObjectURL(imageFile!);
        imgSrc = p.loadImage(imageUrl, (loadedImg: p5.Image) => {
          URL.revokeObjectURL(imageUrl);
          setIsImageLoaded(true);
          console.log("Image loaded successfully");
        }, (p1: Event) => {
          console.log("Failed to load image");
          setIsImageLoaded(false);
        });
      }

      p.setup = () => {
        p.pixelDensity(1); // 1 pixel = 1 pixel on canvas

        if (!imgSrc) {
          p.createCanvas(400, 400);
          p.background(240);
          return;
        }

        // Limit canvas size
        let [mw, mh] = maxCanvasSize;
        let ar = imgSrc.width / imgSrc.height;
        let width = imgSrc.width;
        let height = imgSrc.height;

        console.log("Image size: ", imgSrc.width, imgSrc.height);
        console.log("Max size: ", maxCanvasSize);

        if (ar >= 1.0 && width > mw) {
          width = mw;
          height = width / ar;
        } else if (ar < 1.0 && height > mh) {
          height = mh;
          width = height * ar;
        }

        console.log("Set canvas size: ", width, height);

        p.createCanvas(width, height);

        // Set black value based on threshold
        setBlackValue();

        if (rerenderKey > 0) { // sort image
          imgSrc.loadPixels();
          for (let i = 0; i < 4 * (imgSrc.width * imgSrc.height); i += 4) {
            imgSrcPixels[Math.floor(i / 4)] =
              (255 << 24) |
              (imgSrc.pixels[i] << 16) |
              (imgSrc.pixels[i + 1] << 8) |
              (imgSrc.pixels[i + 2]);
          }
          imgPixels = imgSrcPixels.slice();

          row = 0;
          column = 0;

          // loop through rows
          while (row < imgSrc.height - 1) {
            sortRow();
            row++;
          }

          // loop through columns
          while (column < imgSrc.width - 1) {
            sortColumn();
            column++;
          }

          var imageBytes = 4 * (imgSrc.width * imgSrc.height);

          // Update image pixels
          var i = 0;
          while (i < imageBytes) {
            var col = imgPixels[Math.floor(i / 4)];
            imgSrc.pixels[i++] = col >> 16 & 255;
            imgSrc.pixels[i++] = col >> 8 & 255;
            imgSrc.pixels[i++] = col & 255;
            imgSrc.pixels[i++] = 255;
          }

          // Push the changes
          imgSrc.updatePixels();
        }

        p.image(imgSrc!, 0, 0, p.width, p.height);

      };

      // Add this method to p5 instance for saving the canvas
      // Method redefinition!
      p.saveCanvas = () => {
        // Save canvas as PNG with a timestamp
        p.save(`pixel-sorted-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`);
      };
    };

    // Create a new p5 instance and attach it to the sketchRef
    p5Ref.current = new p5(sketch, p5ParentRef.current);

    // Cleanup on unmount
    return () => {
      console.log("CLEANUP useEffect sketch");
      p5Ref.current?.remove();
      setIsImageLoaded(false);
    };
  }, [imageFile, rerenderKey, threshold]);

  const uploadImage = (file: File | undefined) => {
    if (file) {
      setImageFile(file);
      setRerenderKey(0); // 0 means image just loaded
      console.log("handleImageUpload: ", imageFile)
    } else {
      console.error("File is null");
    }
  }

  const handleSaveImage = () => {
    if (p5Ref.current) {
      // Access the saveCanvas method from the p5 instance
      p5Ref.current.saveCanvas();
    }
  };

  const handleSortPixels = () => {
    if (p5Ref.current) {
      // TODO: 
      // Trigger rerender of image
      setRerenderKey(k => k + 1);
    }
  }


  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setThreshold(Number(e.target.value));


  };

  const setBlackValue = () => {
    console.log("threshold: ", threshold);

    let byte = threshold & 255;

    console.log("byte: ", byte);

    // Fill R G B with threshold byte
    // Full alpha
    blackValue = byte | byte << 8 | byte << 16 | 255 << 24;

    console.log("handleThresholdChange: Black value: ", blackValue);
  };



  const sortRow = () => {
    let width = imgSrc!.width;
    // current row
    var y = row;
    var iRow = y * width; // imgSrc!.width

    // where to start sorting
    var x = 0;

    // where to stop sorting
    var xend = 0;

    while (xend < width - 1) {
      switch (mode) {
        case 0:
          x = getFirstNotBlackX(x, y);
          xend = getNextBlackX(x, y);
          break;
        // case 1:
        //   x = getFirstBrightX(x, y);
        //   xend = getNextDarkX(x, y);
        //   break;
        // case 2:
        //   x = getFirstNotWhiteX(x, y);
        //   xend = getNextWhiteX(x, y);
        //   break;
        default:
          break;
      }

      if (x < 0) break;

      var sortLength = xend - x;

      var unsorted = [];
      var sorted = [];

      for (var i = 0; i < sortLength; i++) {
        unsorted[i] = imgPixels[x + i + iRow];
      }

      sorted = unsorted.sort((n1, n2) => n1 - n2);

      for (var i = 0; i < sortLength; i++) {
        imgPixels[x + i + iRow] = sorted[i];
      }

      x = xend + 1;
    }
  }



  const sortColumn = () => {
    let width = imgSrc!.width;
    let height = imgSrc!.height;
    // current column
    var x = column;

    // where to start sorting
    var y = 0;

    // where to stop sorting
    var yend = 0;

    while (yend < height - 1) {
      switch (mode) {
        case 0:
          y = getFirstNotBlackY(x, y);
          yend = getNextBlackY(x, y);
          break;
        // case 1:
        //   y = getFirstBrightY(x, y);
        //   yend = getNextDarkY(x, y);
        //   break;
        // case 2:
        //   y = getFirstNotWhiteY(x, y);
        //   yend = getNextWhiteY(x, y);
        //   break;
        default:
          break;
      }

      if (y < 0) break;

      var sortLength = yend - y;

      var unsorted = [];
      var sorted = [];

      for (var i = 0; i < sortLength; i++) {
        unsorted[i] = imgPixels[x + (y + i) * width];
      }

      sorted = unsorted.sort((n1, n2) => n1 - n2);

      for (var i = 0; i < sortLength; i++) {
        imgPixels[x + (y + i) * width] = sorted[i];
      }

      y = yend + 1;
    }
  }


  // black x
  const getFirstNotBlackX = (x: number, y: number) => {
    var iRow = y * imgSrc!.width;
    while (imgPixels[x + iRow] < blackValue) {
      x++;
      if (x >= imgSrc!.width)
        return -1;
    }
    return x;
  }


  const getNextBlackX = (x: number, y: number) => {
    x++;
    var iRow = y * imgSrc!.width;
    while (imgPixels[x + iRow] > blackValue) {
      x++;
      if (x >= imgSrc!.width)
        return imgSrc!.width - 1;
    }
    return x - 1;
  }


  // black y
  const getFirstNotBlackY = (x: number, y: number) => {
    if (y < imgSrc!.height) {
      while (imgPixels[x + y * imgSrc!.width] < blackValue) {
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
      while (imgPixels[x + y * imgSrc!.width] > blackValue) {
        y++;
        if (y >= imgSrc!.height)
          return imgSrc!.height - 1;
      }
    }
    return y - 1;
  }


  // brightness x
  // const getFirstBrightX = (x: number, y: number) => {
  //   var iRow = y * imgSrc!.width;
  //   while (brightness2(imgPixels[x + iRow]) < brightnessValue) {
  //     x++;
  //     if (x >= width)
  //       return -1;
  //   }
  //   return x;
  // }


  // const getNextDarkX(_x, _y) {
  //   var x = _x + 1;
  //   var y = _y;

  //   var iRow = y * imgSrc!.width;
  //   while (brightness2(imgPixels[x + iRow]) > brightnessValue) {
  //     x++;
  //     if (x >= width) return width - 1;
  //   }
  //   return x - 1;
  // }


  // // white x
  // const getFirstNotWhiteX = (x: number, y: number) => {
  //   var iRow = y * imgSrc!.width;
  //   while (imgPixels[x + iRow] > whiteValue) {
  //     x++;
  //     if (x >= width)
  //       return -1;
  //   }
  //   return x;
  // }


  // const getNextWhiteX = (x: number, y: number) => {
  //   x++;
  //   var iRow = y * imgSrc!.width;
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
    <div>
      <h1>Pixel Sorter</h1>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the files here ...</p> :
            <p>Drag 'n' drop some files here, or click to select files</p>
        }
      </div>
      <div ref={p5ParentRef}></div>
      {isImageLoaded && (
        <DownloadButton
          onClick={handleSaveImage}
        >
          Save Image
        </DownloadButton>
      )}
      {isImageLoaded && (
        <SortButton
          onClick={handleSortPixels}
        >
          Sort Pixels
        </SortButton>
      )}
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Threshold: {threshold}
          <input
            type="range"
            min="0"
            max="255"
            value={threshold}
            onChange={handleThresholdChange}
          />
        </label>
      </div>
    </div>
  );
}

export default PixelSorter;
