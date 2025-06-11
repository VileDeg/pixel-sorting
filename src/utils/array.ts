export const getArrayRow = (array: number[], row: number, w: number): number[] => {
  return array.slice(row * w, row * w + w);
}

export const getArrayColumn = (array: number[], col: number, w: number, h: number): number[] => {
  // Can't use slice cause pixels array is row-major
  const result: number[] = [];
  for (let y = 0; y < h; y++) {
    result[y] = array[col + y * w];
  }
  return result;
}

export const getArrayDiagonal = (array: number[], d: number, w: number, h: number): number[] => {
  const result: number[] = [];

  let i = 0;
  // Limit y to optimize
  let yStart = Math.max(0, d - w + 1);
  let yEnd = Math.min(h - 1, d);
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


  