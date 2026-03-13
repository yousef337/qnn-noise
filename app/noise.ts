import { NDArray, random } from 'vectorious';

export function ndarrayToNested(arr: NDArray): number[][] {
  const { data, shape } = arr;
  if (shape.length !== 2) {
    throw new Error("Only 2D arrays are supported");
  }
  const [rows, cols] = shape;
  const result: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(data[i * cols + j]);
    }
    result.push(row);
  }
  return result;
}

export const randomNoise = (rows = 4, cols = 4, min = - Math.PI, max= Math.PI) => {

    const matrix = random(rows, cols);
    const scaled = matrix.scale(2*Math.PI).add([[-Math.PI]])
    
    return scaled

}

