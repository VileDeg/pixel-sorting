

export const sobelEdgeDetection = (grayscale: Float32Array, width: number, height: number): Float32Array => {
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

  return edgeMap;
}

export const generateGaussianKernel = (size: number, sigma: number): { kernel: Float32Array, sum: number } => {
  if (size % 2 === 0) {
    throw new Error("Kernel size must be odd");
  }

  const kernel: Float32Array = new Float32Array(size * size);
  const half = Math.floor(size / 2);
  const sigma2 = 2 * sigma * sigma;
  let sum = 0;

  for (let y = -half; y <= half; y++) {
    for (let x = -half; x <= half; x++) {
      const exponent = -(x * x + y * y) / sigma2;
      const value = Math.exp(exponent);
      kernel[(y + half) * size + (x + half)] = value;
      sum += value;
    }
  }

  return { kernel, sum };
};

export const applyGaussianBlurDynamic = (
  grayscale: Float32Array,
  width: number,
  height: number,
  size: number,
  kernel: Float32Array,
  sum: number,
): Float32Array => {
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
export const replicatePad = (arr: Float32Array, width: number, height: number, padSize: number): Float32Array => {
  if (arr.length !== width * height) {
    throw new Error("Array length must match width * height");
  }

  const paddedWidth = width + 2 * padSize;
  const paddedHeight = height + 2 * padSize;
  const paddedSize = paddedWidth * paddedHeight;

  const padded = new Float32Array(paddedSize);

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
  * @param orig_w - Width of the original array
  * @param orig_h - Height of the original array
  * @param padSize - Number of pixels that were padded on all sides
  * @returns Unpadded 1D array
  */
export const unpad = (paddedArr: Float32Array, orig_w: number, orig_h: number, padSize: number): Float32Array => {
  const unpadded = new Float32Array(orig_w * orig_h);
  const paddedWidth = orig_w + 2 * padSize;

  for (let i = 0; i < orig_h; i++) {
    for (let j = 0; j < orig_w; j++) {
      const paddedIndex = (padSize + i) * paddedWidth + (padSize + j);
      const originalIndex = i * orig_w + j;
      unpadded[originalIndex] = paddedArr[paddedIndex];
    }
  }

  return unpadded;
}

// export const toGrayscale = (pixels: Float32Array, width: number, height: number): Float32Array => {
//   return pixels.map((pix) => {
//     const [r, g, b] = getRGB(pix);
//     const val = getBrightness(r, g, b);
//     // Fills just 1 byte! g, b, a are 0
//     return val;
//   })
// }

export const toGrayscale = (pixels: Float32Array, width: number, height: number): Float32Array => {
  const grayscale = pixels.map((pix) => {
    const [r, g, b] = getRGB(pix);
    const val = getBrightness(r, g, b);
    // Fill all bytes, full aplha
    //return val | val << 8 | val << 16 | 255 << 24;
    return val;
  })
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
  //return Math.min(0.299 * r + 0.587 * g + 0.114 * b, 255);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export const getRGB = (px: number) => {
  let r = px & 255;
  let g = (px >> 8) & 255;
  let b = (px >> 16) & 255;
  return [r, g, b];
}
