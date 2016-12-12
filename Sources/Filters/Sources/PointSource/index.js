import * as macro     from '../../../macro';
import vtkPolyData    from '../../../Common/DataModel/PolyData';
import vtkMath        from '../../../Common/Core/Math';

// ----------------------------------------------------------------------------
// vtkPointSource methods
// ----------------------------------------------------------------------------

export function vtkPointSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPointSource');

  function requestData(inData, outData) {
    if (model.deleted) {
      return;
    }

    const dataset = outData[0];

    if (dataset && dataset.getMTime() > model.mtime) {
      return;
    }

    // Check input
    const pointDataType = dataset ? dataset.getPoints().getData().getDataType() : 'Float32Array';
    const pd = vtkPolyData.newInstance();

    // hand create a point cloud
    const numPts = model.numberOfPoints;

    // Points
    const points = new window[pointDataType](numPts * 3);
    pd.getPoints().getData().setData(points, 3);

    // Cells
    const verts = new Uint32Array(numPts + 1);
    pd.getVerts().setData(verts, 1);

    let cosphi;
    let sinphi;
    let rho;
    let radius;
    let theta;
    for (let i = 0; i < numPts; i++) {
      cosphi = 1 - (2.0 * vtkMath.random());
      sinphi = Math.sqrt(1 - (cosphi * cosphi));
      rho = model.radius * Math.pow(vtkMath.random(), 0.33333333);
      radius = rho * sinphi;
      theta = 2.0 * Math.PI * vtkMath.random();
      points[(i * 3)] = model.center[0] + (radius * Math.cos(theta));
      points[(i * 3) + 1] = model.center[1] + (radius * Math.sin(theta));
      points[(i * 3) + 2] = model.center[2] + (rho * cosphi);
    }

    // Generate point connectivity
    //
    verts[0] = numPts;
    for (let i = 0; i < numPts; i++) {
      verts[i + 1] = i;
    }

    // Update output
    outData[0] = pd;
  }

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfPoints: 10,
  center: [0, 0, 0],
  radius: 0.5,
  pointType: 'Float32Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'numberOfPoints',
    'radius',
  ]);
  macro.setGetArray(publicAPI, model, [
    'center',
  ], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkPointSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPointSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
