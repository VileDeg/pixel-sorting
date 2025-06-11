

export const sobelEdgeDetection = (grayscale: Float32Array, width: number, height: number): number[] => {
  const edgeMap = new Float32Array(width * height);

  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0;
      let sumY = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = x + kx;
          const py = y + ky;
          const weightX = gx[(ky + 1) * 3 + (kx + 1)];
          const weightY = gy[(ky + 1) * 3 + (kx + 1)];
          const val = grayscale[py * width + px];

          sumX += val * weightX;
          sumY += val * weightY;
        }
      }

      const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
      edgeMap[y * width + x] = magnitude;
    }
  }

  return Array.from(edgeMap);
}

export const generateGaussianKernel = (size: number, sigma: number): { kernel: number[], sum: number } => {
  if (size % 2 === 0) {
    throw new Error("Kernel size must be odd");
  }

  const kernel: number[] = [];
  const half = Math.floor(size / 2);
  const sigma2 = 2 * sigma * sigma;
  let sum = 0;

  for (let y = -half; y <= half; y++) {
    for (let x = -half; x <= half; x++) {
      const exponent = -(x * x + y * y) / sigma2;
      const value = Math.exp(exponent);
      kernel.push(value);
      sum += value;
    }
  }

  return { kernel, sum };
};

export const applyGaussianBlurDynamic = (
  grayscale: number[],
  width: number,
  height: number,
  size: number,
  kernel: number[],
  sum: number,
): Float32Array => {
  // TODO: precompute kernel

  const output = new Float32Array(width * height);
  const half = Math.floor(size / 2);

  for (let y = half; y < height - half; y++) {
    for (let x = half; x < width - half; x++) {
      let acc = 0;

      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = x + kx;
          const py = y + ky;
          const weight = kernel[(ky + half) * size + (kx + half)];
          const val = grayscale[py * width + px];
          acc += val * weight;
        }
      }

      output[y * width + x] = acc / sum;
    }
  }

  return output;
};


/**
* Apply replicate padding to a 1D array representing a 2D image
* @param arr - 1D array of numbers (row-major order)
* @param width - Width of the 2D image
* @param height - Height of the 2D image  
* @param padSize - Number of pixels to pad on all sides
* @returns Padded 1D array
*/
export const replicatePad = (arr: number[], width: number, height: number, padSize: number): number[] => {
  if (arr.length !== width * height) {
    throw new Error("Array length must match width * height");
  }

  const paddedWidth = width + 2 * padSize;
  const paddedHeight = height + 2 * padSize;
  const paddedSize = paddedWidth * paddedHeight;

  const padded = new Array<number>(paddedSize);

  // Helper function to get index in original array
  const getOriginal = (row: number, col: number): number => {
    return arr[row * width + col];
  };

  // Helper function to set index in padded array
  const setPadded = (row: number, col: number, value: number): void => {
    padded[row * paddedWidth + col] = value;
  };

  // Copy original array to center
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      setPadded(padSize + i, padSize + j, getOriginal(i, j));
    }
  }

  // Replicate top rows
  for (let i = 0; i < padSize; i++) {
    for (let j = padSize; j < padSize + width; j++) {
      setPadded(i, j, getOriginal(0, j - padSize));
    }
  }

  // Replicate bottom rows
  for (let i = 0; i < padSize; i++) {
    for (let j = padSize; j < padSize + width; j++) {
      setPadded(padSize + height + i, j, getOriginal(height - 1, j - padSize));
    }
  }

  // Replicate left columns (including corners)
  for (let j = 0; j < padSize; j++) {
    for (let i = 0; i < paddedHeight; i++) {
      setPadded(i, j, padded[i * paddedWidth + padSize]);
    }
  }

  // Replicate right columns (including corners)
  for (let j = 0; j < padSize; j++) {
    for (let i = 0; i < paddedHeight; i++) {
      setPadded(i, padSize + width + j, padded[i * paddedWidth + padSize + width - 1]);
    }
  }

  return padded;
};

/**
  * Remove padding from a padded 1D array
  * @param paddedArr - Padded 1D array
  * @param paddedWidth - Width of the padded array
  * @param width - Width of the original array
  * @param height - Height of the original array
  * @param padSize - Number of pixels that were padded on all sides
  * @returns Unpadded 1D array
  */
export const unpad = (paddedArr: number[], width: number, height: number, padSize: number): number[] => {
  const result = new Array<number>(width * height);
  const paddedWidth = width + 2 * padSize;

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const paddedIndex = (padSize + i) * paddedWidth + (padSize + j);
      const originalIndex = i * width + j;
      result[originalIndex] = paddedArr[paddedIndex];
    }
  }

  return result;
}

export const toGrayscale = (pixels: number[], width: number, height: number): number[] => {
  let grayscale: number[] = pixels.map((val) => {
    const [r, g, b] = getRGB(val);
    return 0.299 * r + 0.587 * g + 0.114 * b;
  })
  // Only 1 byte is filled by this!
  return grayscale;
}


export const aboveThreshold = (pixel: number, threshold: number) => {
  let [r, g, b] = getRGB(pixel);
  let br = getBrightness(r, g, b);
  //return pixel >= getBlackValue(threshold);
  return br >= threshold;
}

export const getBrightness = (r: number, g: number, b: number): number => {
  // Returns range 0-255
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export const getRGB = (px: number) => {
  let r = px & 255;
  let g = (px >> 8) & 255;
  let b = (px >> 16) & 255;
  return [r, g, b];
}
