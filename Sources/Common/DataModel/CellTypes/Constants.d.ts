export interface T100 {
  VTK_EMPTY_CELL: number;
  VTK_VERTEX: number;
  VTK_POLY_VERTEX: number;
  VTK_LINE: number;
  VTK_POLY_LINE: number;
  VTK_TRIANGLE: number;
  VTK_TRIANGLE_STRIP: number;
  VTK_POLYGON: number;
  VTK_PIXEL: number;
  VTK_QUAD: number;
  VTK_TETRA: number;
  VTK_VOXEL: number;
  VTK_HEXAHEDRON: number;
  VTK_WEDGE: number;
  VTK_PYRAMID: number;
  VTK_PENTAGONAL_PRISM: number;
  VTK_HEXAGONAL_PRISM: number;
  VTK_QUADRATIC_EDGE: number;
  VTK_QUADRATIC_TRIANGLE: number;
  VTK_QUADRATIC_QUAD: number;
  VTK_QUADRATIC_POLYGON: number;
  VTK_QUADRATIC_TETRA: number;
  VTK_QUADRATIC_HEXAHEDRON: number;
  VTK_QUADRATIC_WEDGE: number;
  VTK_QUADRATIC_PYRAMID: number;
  VTK_BIQUADRATIC_QUAD: number;
  VTK_TRIQUADRATIC_HEXAHEDRON: number;
  VTK_QUADRATIC_LINEAR_QUAD: number;
  VTK_QUADRATIC_LINEAR_WEDGE: number;
  VTK_BIQUADRATIC_QUADRATIC_WEDGE: number;
  VTK_BIQUADRATIC_QUADRATIC_HEXAHEDRON: number;
  VTK_BIQUADRATIC_TRIANGLE: number;
  VTK_CUBIC_LINE: number;
  VTK_CONVEX_POINT_SET: number;
  VTK_POLYHEDRON: number;
  VTK_PARAMETRIC_CURVE: number;
  VTK_PARAMETRIC_SURFACE: number;
  VTK_PARAMETRIC_TRI_SURFACE: number;
  VTK_PARAMETRIC_QUAD_SURFACE: number;
  VTK_PARAMETRIC_TETRA_REGION: number;
  VTK_PARAMETRIC_HEX_REGION: number;
  VTK_HIGHER_ORDER_EDGE: number;
  VTK_HIGHER_ORDER_TRIANGLE: number;
  VTK_HIGHER_ORDER_QUAD: number;
  VTK_HIGHER_ORDER_POLYGON: number;
  VTK_HIGHER_ORDER_TETRAHEDRON: number;
  VTK_HIGHER_ORDER_WEDGE: number;
  VTK_HIGHER_ORDER_PYRAMID: number;
  VTK_HIGHER_ORDER_HEXAHEDRON: number;
  VTK_LAGRANGE_CURVE: number;
  VTK_LAGRANGE_TRIANGLE: number;
  VTK_LAGRANGE_QUADRILATERAL: number;
  VTK_LAGRANGE_TETRAHEDRON: number;
  VTK_LAGRANGE_HEXAHEDRON: number;
  VTK_LAGRANGE_WEDGE: number;
  VTK_LAGRANGE_PYRAMID: number;
  VTK_NUMBER_OF_CELL_TYPES: number;
}
export const CellType: T100;
export const CellTypesStrings: string[];
export interface T101 {
  CellType: T100;
  CellTypesStrings: string[];
}
declare const T102: T101;
export default T102;