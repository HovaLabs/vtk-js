import test      from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow       from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer           from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkLookupTable        from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkActor              from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper             from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkDataArray          from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData           from 'vtk.js/Sources/Common/DataModel/PolyData';

import baseline from './testInterpolateScalarsBeforeMapping.png';

test.onlyIfWebGL('Test Interpolate Scalars Before Colors', (t) => {
  t.ok('rendering', 'vtkOpenGLPolyDataMapper InterpolateScalarsBeforeColors');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = vtkActor.newInstance();
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(1.0, 0.5, 0.5);
  renderer.addActor(actor);

  const mapper = vtkMapper.newInstance();
  actor.setMapper(mapper);

  const lut = vtkLookupTable.newInstance();
  lut.setUseBelowRangeColor(true);
  lut.setUseAboveRangeColor(true);
  lut.setNanColor(0.8, 0.8, 0.6, 1.0);
  mapper.setLookupTable(lut);

  // hand create a plane with special scalars
  const pd = vtkPolyData.newInstance();
  const res = 10;

  // Points
  const points = new Float32Array(res * res * 3);
  pd.getPoints().setData(points, 3);

  // Cells
  let cellLocation = 0;
  const polys = new Uint32Array(8 * (res - 1) * (res - 1));
  pd.getPolys().setData(polys, 1);

  // Scalars
  const scalars = new Float32Array(res * res);

  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const idx = (i * res) + j;
      points[idx * 3] = j;
      points[(idx * 3) + 1] = i;
      points[(idx * 3) + 2] = 0.0;
      // set scalars to be -0.5 to 1.5 so we have above and below range
      // data.
      scalars[idx] = -0.5 + (2.0 * j / (res - 1.0));
      // also add nan for some data
      if (i === 4) {
        scalars[idx] = NaN;
      }
    }
  }

  for (let i = 0; i < (res - 1); i++) {
    for (let j = 0; j < (res - 1); j++) {
      const idx = ((i * res) + j);
      polys[cellLocation++] = 3;
      polys[cellLocation++] = idx;
      polys[cellLocation++] = idx + 1;
      polys[cellLocation++] = idx + res;
      polys[cellLocation++] = 3;
      polys[cellLocation++] = idx + 1;
      polys[cellLocation++] = idx + res + 1;
      polys[cellLocation++] = idx + res;
    }
  }

  const da = vtkDataArray.newInstance({ numberOfComponents: 1, values: scalars });
  pd.getPointData().setScalars(da);

  mapper.setInputData(pd);
  mapper.setInterpolateScalarsBeforeMapping(true);

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const image = glwindow.captureImage();

  testUtils.compareImages(image, [baseline], 'Rendering/OpenGL/PolyDataMapper/', t);
});
