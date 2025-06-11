export const getArrayRow = (array: Float32Array, row: number, w: number): Float32Array => {
  return array.slice(row * w, row * w + w);
}

export const getArrayColumn = (array: Float32Array, col: number, w: number, h: number): Float32Array => {
  // Can't use slice cause pixels array is row-major
  const result: Float32Array = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    result[y] = array[col + y * w];
  }
  return result;
}

export const getArrayDiagonal = (array: Float32Array, d: number, w: number, h: number): Float32Array => {
  let i = 0;
  // Limit y to optimize
  let yStart = Math.max(0, d - w + 1);
  let yEnd = Math.min(h - 1, d);
  
  const result: Float32Array = new Float32Array(yEnd - yStart + 1); // TODO: +1?
  for (let y = yStart; y <= yEnd; y++) {
    let x = d - y;

    if (x >= w || y >= h) {
      throw new Error("Overflow (x,y): " + x + '' + y);
    }

    result[i] = array[x + y * w];
    i++;
  }
  return result;
}


  